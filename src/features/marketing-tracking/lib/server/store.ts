import { promises as fs } from "node:fs"
import path from "node:path"

import type { ModuleId } from "@/src/shared/lib/constants/modules"
import {
  TRACKING_STORE_VERSION,
  type ModuleStat,
  type TrackingEvent,
  type TrackingStoreShape,
  type VisitorOnboarding,
  type VisitorRecord,
} from "../types"

const DATA_DIR =
  process.env.TRACKING_DATA_DIR ?? path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "tracking.json")

const EMPTY_STORE: TrackingStoreShape = {
  version: TRACKING_STORE_VERSION,
  visitors: {},
  aliases: {},
}

/**
 * Route handlers run concurrently, so every read-modify-write is chained onto a
 * single promise to avoid two requests clobbering each other's visitors.
 */
let writeChain: Promise<unknown> = Promise.resolve()

/**
 * Populated only when the filesystem is unusable (read-only container, missing
 * volume). Keeping an in-memory copy means the app degrades to "tracking works
 * until restart" instead of returning 500s on every page view.
 */
let memoryStore: TrackingStoreShape | null = null

function clone(store: TrackingStoreShape): TrackingStoreShape {
  return JSON.parse(JSON.stringify(store)) as TrackingStoreShape
}

/* -------------------------------------------------------------------------- */
/*                                  Identity                                  */
/* -------------------------------------------------------------------------- */

/**
 * A visitor is the person, not the browser. The localStorage id only survives
 * until storage is cleared, so it is treated as a hint: the phone captured on
 * the company step and the email captured at sign-in are what actually pin a
 * record to a human, and either one arriving is enough to reunite the browser
 * with the record it already had.
 */
function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

/**
 * Compared on digits alone so "+20 123 456 7890" and "+201234567890" are the
 * same person. Anything shorter than 7 digits is a half-typed number, not an
 * identity — matching on it would fuse unrelated visitors.
 */
function normalizePhone(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, "") ?? ""
  return digits.length >= 7 ? digits : null
}

function identityKeys(visitor: VisitorRecord): string[] {
  const keys: string[] = []
  const email = normalizeEmail(visitor.email)
  if (email) keys.push(`email:${email}`)
  const phone = normalizePhone(visitor.phone)
  if (phone) keys.push(`phone:${phone}`)
  return keys
}

function findByIdentity(
  store: TrackingStoreShape,
  key: string,
  exceptId: string,
): VisitorRecord | null {
  for (const candidate of Object.values(store.visitors)) {
    if (candidate.visitorId === exceptId) continue
    if (identityKeys(candidate).includes(key)) return candidate
  }
  return null
}

/** Walks the alias chain to the record that is still alive. */
function resolveVisitorId(store: TrackingStoreShape, visitorId: string): string {
  let id = visitorId
  const seen = new Set([id])
  while (store.aliases[id]) {
    id = store.aliases[id]
    // A cycle can only come from a hand-edited file, but it must not hang the
    // request that reads it.
    if (seen.has(id)) break
    seen.add(id)
  }
  return id
}

/* -------------------------------------------------------------------------- */
/*                                   Merging                                  */
/* -------------------------------------------------------------------------- */

function mergeModules(
  target: Partial<Record<ModuleId, ModuleStat>>,
  source: Partial<Record<ModuleId, ModuleStat>>,
): void {
  for (const [id, stat] of Object.entries(source) as [ModuleId, ModuleStat][]) {
    if (!stat) continue
    const existing = target[id]
    if (!existing) {
      target[id] = stat
      continue
    }
    existing.views += stat.views
    existing.msSpent += stat.msSpent
    if (
      stat.lastVisitAt &&
      (!existing.lastVisitAt || stat.lastVisitAt > existing.lastVisitAt)
    ) {
      existing.lastVisitAt = stat.lastVisitAt
    }
    for (const [route, count] of Object.entries(stat.pages)) {
      existing.pages[route] = (existing.pages[route] ?? 0) + count
    }
  }
}

function mergeOnboarding(
  target: VisitorRecord,
  source: VisitorOnboarding | null,
): void {
  if (!source) return
  const onboarding = ensureOnboarding(target)
  onboarding.industry ??= source.industry
  onboarding.stage ??= source.stage
  onboarding.teamSize ??= source.teamSize
  for (const tool of source.tools) {
    if (!onboarding.tools.includes(tool)) onboarding.tools.push(tool)
  }
  for (const step of source.stepsCompleted) {
    if (!onboarding.stepsCompleted.includes(step)) {
      onboarding.stepsCompleted.push(step)
    }
  }
  // The funnel asks *whether* they converted, so the first completion is the
  // meaningful one.
  if (
    source.completedAt &&
    (!onboarding.completedAt || source.completedAt < onboarding.completedAt)
  ) {
    onboarding.completedAt = source.completedAt
  }
}

/** Folds `source` into `target`. Every count is summed — nothing is discarded. */
function mergeVisitors(target: VisitorRecord, source: VisitorRecord): void {
  target.name ??= source.name
  target.email ??= source.email
  target.phone ??= source.phone
  target.company ??= source.company
  if (source.firstSeenAt < target.firstSeenAt) {
    target.firstSeenAt = source.firstSeenAt
  }
  if (source.lastSeenAt > target.lastSeenAt) {
    target.lastSeenAt = source.lastSeenAt
  }
  target.sessions += source.sessions
  target.totalViews += source.totalViews
  target.totalMs += source.totalMs
  mergeModules(target.modules, source.modules)
  mergeOnboarding(target, source.onboarding)
}

function absorb(
  store: TrackingStoreShape,
  survivor: VisitorRecord,
  doomed: VisitorRecord,
): void {
  mergeVisitors(survivor, doomed)
  delete store.visitors[doomed.visitorId]
  store.aliases[doomed.visitorId] = survivor.visitorId
  // Aliases already pointing at the record that just died are re-pointed, so
  // the chain never needs more than one hop.
  for (const [from, to] of Object.entries(store.aliases)) {
    if (to === doomed.visitorId) store.aliases[from] = survivor.visitorId
  }
}

/**
 * Collapses `visitor` with any other record sharing its phone or email, and
 * returns whichever record survived. The oldest record wins so a visitor's
 * canonical id stays put once it exists.
 */
function reconcileIdentity(
  store: TrackingStoreShape,
  visitor: VisitorRecord,
): VisitorRecord {
  let canonical = visitor
  // A single batch can reveal a phone matching one record and an email matching
  // another, so keep collapsing until nothing else matches.
  for (let pass = 0; pass < 8; pass += 1) {
    let merged = false
    for (const key of identityKeys(canonical)) {
      const match = findByIdentity(store, key, canonical.visitorId)
      if (!match) continue
      const survivor =
        match.firstSeenAt <= canonical.firstSeenAt ? match : canonical
      absorb(store, survivor, survivor === match ? canonical : match)
      canonical = survivor
      merged = true
      break
    }
    if (!merged) break
  }
  return canonical
}

/* -------------------------------------------------------------------------- */
/*                                Persistence                                 */
/* -------------------------------------------------------------------------- */

/**
 * Brings a store read off disk up to the current shape, collapsing duplicates
 * written back when a cleared localStorage still meant a brand-new visitor.
 * Reports whether anything changed so the caller can persist it exactly once.
 */
function migrate(store: TrackingStoreShape): boolean {
  if (!store.aliases || typeof store.aliases !== "object") store.aliases = {}
  if (store.version >= TRACKING_STORE_VERSION) return false

  for (const visitor of Object.values(store.visitors)) {
    visitor.phone ??= null
  }
  for (const visitor of Object.values(store.visitors)) {
    // May already have been absorbed by an earlier pass.
    if (!store.visitors[visitor.visitorId]) continue
    reconcileIdentity(store, visitor)
  }

  store.version = TRACKING_STORE_VERSION
  return true
}

async function readStore(): Promise<{
  store: TrackingStoreShape
  migrated: boolean
}> {
  if (memoryStore) return { store: clone(memoryStore), migrated: false }
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8")
    const parsed = JSON.parse(raw) as TrackingStoreShape
    if (!parsed || typeof parsed !== "object" || !parsed.visitors) {
      return { store: clone(EMPTY_STORE), migrated: false }
    }
    return { store: parsed, migrated: migrate(parsed) }
  } catch {
    // Missing file on first run, or unreadable/corrupt JSON — start clean
    // rather than taking the route handler down.
    return { store: clone(EMPTY_STORE), migrated: false }
  }
}

async function writeStore(store: TrackingStoreShape): Promise<void> {
  if (memoryStore) {
    memoryStore = clone(store)
    return
  }
  const tmp = `${DATA_FILE}.${process.pid}.tmp`
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8")
    // Rename is atomic on the same filesystem, so a crash mid-write can never
    // leave a half-serialised tracking.json behind.
    await fs.rename(tmp, DATA_FILE)
  } catch {
    memoryStore = clone(store)
    await fs.rm(tmp, { force: true }).catch(() => {})
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Events                                   */
/* -------------------------------------------------------------------------- */

function emptyModuleStat(): ModuleStat {
  return { views: 0, msSpent: 0, lastVisitAt: null, pages: {} }
}

function createVisitor(visitorId: string, at: string): VisitorRecord {
  return {
    visitorId,
    name: null,
    email: null,
    phone: null,
    company: null,
    onboarding: null,
    firstSeenAt: at,
    lastSeenAt: at,
    sessions: 0,
    totalViews: 0,
    totalMs: 0,
    modules: {},
  }
}

function ensureOnboarding(visitor: VisitorRecord) {
  visitor.onboarding ??= {
    industry: null,
    stage: null,
    teamSize: null,
    tools: [],
    stepsCompleted: [],
    completedAt: null,
  }
  return visitor.onboarding
}

/** A page view of unknown module still counts toward the visitor's totals. */
function applyEvent(visitor: VisitorRecord, event: TrackingEvent): void {
  if (event.at > visitor.lastSeenAt) visitor.lastSeenAt = event.at

  switch (event.type) {
    case "session-start": {
      visitor.sessions += 1
      break
    }

    case "page-view": {
      const ms = Number.isFinite(event.ms) ? Math.max(0, Math.round(event.ms)) : 0
      visitor.totalViews += 1
      visitor.totalMs += ms
      if (!event.module) break

      const moduleId = event.module as ModuleId
      const stat = (visitor.modules[moduleId] ??= emptyModuleStat())
      stat.views += 1
      stat.msSpent += ms
      stat.lastVisitAt = event.at
      stat.pages[event.path] = (stat.pages[event.path] ?? 0) + 1
      break
    }

    case "onboarding-step": {
      const onboarding = ensureOnboarding(visitor)
      if (!onboarding.stepsCompleted.includes(event.step)) {
        onboarding.stepsCompleted.push(event.step)
      }
      const a = event.answers
      if (a.companyName) visitor.company = a.companyName
      if (a.phone) visitor.phone = a.phone
      if (a.industry) onboarding.industry = a.industry
      if (a.stage) onboarding.stage = a.stage
      if (a.teamSize) onboarding.teamSize = a.teamSize
      if (a.tools) onboarding.tools = a.tools
      break
    }

    case "onboarding-complete": {
      const onboarding = ensureOnboarding(visitor)
      const a = event.answers
      if (a.companyName) visitor.company = a.companyName
      if (a.phone) visitor.phone = a.phone
      if (a.industry) onboarding.industry = a.industry
      if (a.stage) onboarding.stage = a.stage
      if (a.teamSize) onboarding.teamSize = a.teamSize
      if (a.tools) onboarding.tools = a.tools
      onboarding.completedAt = event.at
      break
    }

    case "identify": {
      const onboarding = ensureOnboarding(visitor)
      if (event.name) visitor.name = event.name
      if (event.email) visitor.email = event.email
      if (!onboarding.stepsCompleted.includes("login")) {
        onboarding.stepsCompleted.push("login")
      }
      break
    }
  }
}

/**
 * Applies a batch and returns the id the events actually landed on, which
 * differs from `visitorId` whenever this browser turned out to belong to a
 * visitor already on file. The caller hands that id back to the client so the
 * next visit addresses the record directly instead of via an alias.
 */
export async function recordEvents(
  visitorId: string,
  events: TrackingEvent[],
): Promise<string> {
  const task = writeChain.then(async () => {
    const { store } = await readStore()
    const firstAt = events[0]?.at ?? new Date().toISOString()
    const canonicalId = resolveVisitorId(store, visitorId)
    const visitor = (store.visitors[canonicalId] ??= createVisitor(
      canonicalId,
      firstAt,
    ))

    for (const event of events) applyEvent(visitor, event)

    // Identity can only have arrived with the events just applied, so matching
    // once at the end is enough — a merge sums counts either way.
    const survivor = reconcileIdentity(store, visitor)

    await writeStore(store)
    return survivor.visitorId
  })

  // Keep the chain alive even if one write fails, otherwise every later
  // request would inherit the rejection.
  writeChain = task.catch(() => {})
  return task
}

export async function getVisitors(): Promise<VisitorRecord[]> {
  const { store, migrated } = await readStore()
  // Fold the one-time cleanup back to disk so the file and the dashboard agree.
  if (migrated) {
    const task = writeChain.then(() => writeStore(store))
    writeChain = task.catch(() => {})
    await task
  }
  return Object.values(store.visitors)
}
