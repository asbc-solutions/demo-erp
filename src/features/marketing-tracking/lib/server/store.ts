import { promises as fs } from "node:fs"
import path from "node:path"

import type { ModuleId } from "@/src/shared/lib/constants/modules"
import type {
  ModuleStat,
  TrackingEvent,
  TrackingStoreShape,
  VisitorRecord,
} from "../types"

const DATA_DIR =
  process.env.TRACKING_DATA_DIR ?? path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "tracking.json")

const EMPTY_STORE: TrackingStoreShape = { version: 1, visitors: {} }

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

async function readStore(): Promise<TrackingStoreShape> {
  if (memoryStore) return clone(memoryStore)
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8")
    const parsed = JSON.parse(raw) as TrackingStoreShape
    if (!parsed || typeof parsed !== "object" || !parsed.visitors) {
      return clone(EMPTY_STORE)
    }
    return parsed
  } catch {
    // Missing file on first run, or unreadable/corrupt JSON — start clean
    // rather than taking the route handler down.
    return clone(EMPTY_STORE)
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

function emptyModuleStat(): ModuleStat {
  return { views: 0, msSpent: 0, lastVisitAt: null, pages: {} }
}

function createVisitor(visitorId: string, at: string): VisitorRecord {
  return {
    visitorId,
    name: null,
    email: null,
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

export async function recordEvents(
  visitorId: string,
  events: TrackingEvent[],
): Promise<void> {
  const task = writeChain.then(async () => {
    const store = await readStore()
    const firstAt = events[0]?.at ?? new Date().toISOString()
    const visitor = (store.visitors[visitorId] ??= createVisitor(
      visitorId,
      firstAt,
    ))
    for (const event of events) applyEvent(visitor, event)
    await writeStore(store)
  })

  // Keep the chain alive even if one write fails, otherwise every later
  // request would inherit the rejection.
  writeChain = task.catch(() => {})
  await task
}

export async function getVisitors(): Promise<VisitorRecord[]> {
  const store = await readStore()
  return Object.values(store.visitors)
}
