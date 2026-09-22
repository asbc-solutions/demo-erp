import { collection, createRow, defineCollection, type Row } from "../../demo-db"
import type { DemoRequest, DemoResult, DemoRoute } from "../../demo-router"
import { FIN_NOW } from "../../seed/finance/calendar"
import { FIN_ACTOR } from "../../seed/finance/ledger"
import { FIN_COLLECTIONS } from "./collections"
import { allJournals } from "./ledger-model"

/**
 * The finance audit log: a seeded quarter of history that points at real
 * documents, plus an event for every successful write made in this session.
 */

export const AUDIT_COLLECTION = "finance/audit-events"

export type AuditSource = "ui" | "import" | "system"

type AuditEvent = {
  at: string
  actor: string
  action: string
  object_type: string
  object: string
  href: string | null
  source: AuditSource
}

const ACTORS = ["Karim Fouad", "Nour Adel", "Sara Hany", "Omar Deeb", "Hala Mostafa", "Layla Adham"]
const HISTORY_SIZE = 600
const STEP_MS = 3.6 * 60 * 60 * 1000
const NEWEST = Date.UTC(2026, 2, 31, 9, 0)
const POSTING_KEYS = ["sale.revenue", "sale.receivable", "sale.credit", "purchase.expense", "purchase.payable", "receipt.bank", "payment.bank", "vat.output", "vat.input"]

function random(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

/** The most recent row on or before the day, stepping back a little so neighbours differ. */
function near(rows: Row[], date: string, field: string, jitter: number): Row | null {
  const before = rows.filter((row) => String(row[field] ?? "") <= date)
  if (!before.length) return rows[0] ?? null
  return before[Math.max(0, before.length - 1 - Math.floor(jitter * Math.min(6, before.length)))]
}

function buildHistory(): Row[] {
  const next = random(2026_03_31)
  const byDate = (rows: Row[], field: string) => [...rows].sort((a, b) => String(a[field]).localeCompare(String(b[field])))
  const journals = byDate(allJournals().filter((row) => row.status === "posted" || row.status === "reversed"), "date")
  const vouchers = byDate([...collection(FIN_COLLECTIONS.receipts), ...collection(FIN_COLLECTIONS.payments)], "date")
  const bills = byDate(collection(FIN_COLLECTIONS.apDocuments).filter((row) => row.type === "bill"), "date")
  const eDocuments = byDate(collection(FIN_COLLECTIONS.eDocuments), "issued")
  const contacts = collection(FIN_COLLECTIONS.contacts)
  const treasuries = collection(FIN_COLLECTIONS.treasuries)
  const banks = treasuries.filter((row) => row.kind === "bank")
  const recurring = collection(FIN_COLLECTIONS.recurringJournals)

  const userActions: [number, (date: string, jitter: number) => Omit<AuditEvent, "at" | "actor" | "source">][] = [
    [26, (date, jitter) => {
      const journal = near(journals, date, "date", jitter)
      return { action: "Posted entry", object_type: "Journal entry", object: String(journal?.number ?? "—"), href: journal ? `/finance/journals/${String(journal.number)}` : null }
    }],
    [18, (date, jitter) => {
      const voucher = near(vouchers, date, "date", jitter)
      return { action: "Created voucher", object_type: "Voucher", object: String(voucher?.number ?? "—"), href: null }
    }],
    [14, (date, jitter) => {
      const bill = near(bills, date, "date", jitter)
      return { action: "Approved bill", object_type: "Bill", object: String(bill?.number ?? "—"), href: null }
    }],
    [10, (date, jitter) => {
      const document = near(eDocuments, date, "issued", jitter)
      return { action: "Submitted e-invoice", object_type: "E-document", object: String(document?.number ?? "—"), href: document ? `/finance/tax/e-invoicing/${String(document.id)}` : null }
    }],
    [8, (_date, jitter) => {
      const bank = banks[Math.floor(jitter * banks.length)]
      return { action: "Matched statement lines", object_type: "Treasury", object: String(bank.name), href: `/finance/treasuries/${String(bank.id)}` }
    }],
    [6, (_date, jitter) => {
      const treasury = treasuries[Math.floor(jitter * treasuries.length)]
      return { action: "Reconciled account", object_type: "Treasury", object: String(treasury.name), href: `/finance/treasuries/${String(treasury.id)}` }
    }],
    [6, (_date, jitter) => {
      const contact = contacts[Math.floor(jitter * contacts.length)]
      const side = contact.kind === "supplier" ? "ap" : "ar"
      return { action: "Updated contact", object_type: contact.kind === "supplier" ? "Supplier" : "Customer", object: String(contact.name), href: `/finance/${side}/${String(contact.id)}` }
    }],
    [4, (date, jitter) => {
      const journal = near(journals, date, "date", jitter)
      return { action: "Reversed entry", object_type: "Journal entry", object: String(journal?.number ?? "—"), href: journal ? `/finance/journals/${String(journal.number)}` : null }
    }],
    [3, (_date, jitter) => ({ action: "Changed routing", object_type: "Posting map", object: POSTING_KEYS[Math.floor(jitter * POSTING_KEYS.length)], href: "/finance/settings/posting-map" })],
  ]
  const weightTotal = userActions.reduce((sum, [weight]) => sum + weight, 0)
  const pickUser = (roll: number) => {
    let cursor = roll * weightTotal
    for (const [weight, build] of userActions) {
      if (cursor < weight) return build
      cursor -= weight
    }
    return userActions[0][1]
  }

  const events: AuditEvent[] = []
  for (let index = 0; index < HISTORY_SIZE; index++) {
    const at = new Date(NEWEST - index * STEP_MS).toISOString()
    const date = at.slice(0, 10)
    const jitter = next()
    const roll = next()
    if (index % 20 === 13) {
      const kind = index % 3
      const rule = recurring[index % Math.max(1, recurring.length)]
      events.push(
        kind === 0
          ? { at, actor: "System", action: "Ran recurring journal", object_type: "Recurring journal", object: String(rule?.code ?? rule?.id ?? "RJ-01"), href: "/finance/recurring", source: "system" }
          : kind === 1
            ? { at, actor: "System", action: "Refreshed exchange rates", object_type: "Currency", object: "USD/EGP fixing", href: "/finance/currencies", source: "system" }
            : { at, actor: "System", action: "Checked e-invoice status", object_type: "E-document batch", object: "ETA submissions", href: "/finance/tax/e-invoicing", source: "system" },
      )
    } else if (index % 14 === 6) {
      const bank = banks[index % banks.length]
      events.push({ at, actor: ACTORS[index % ACTORS.length], action: "Imported statement", object_type: "Treasury", object: String(bank.name), href: `/finance/reconciliation/${String(bank.id)}`, source: "import" })
    } else {
      events.push({ at, actor: ACTORS[index % ACTORS.length], ...pickUser(roll)(date, jitter), source: "ui" })
    }
  }

  // The closes that actually happened, on the days the periods record.
  const milestones: AuditEvent[] = [
    { at: "2026-02-06T15:00:00.000Z", actor: "Karim Fouad", action: "Closed period", object_type: "Financial period", object: "January 2026", href: "/finance/periods", source: "ui" },
    { at: "2026-03-07T15:00:00.000Z", actor: "Karim Fouad", action: "Closed period", object_type: "Financial period", object: "February 2026", href: "/finance/periods", source: "ui" },
    { at: "2026-01-20T12:00:00.000Z", actor: "Karim Fouad", action: "Locked year", object_type: "Fiscal year", object: "FY2025", href: "/finance/periods/year-end", source: "ui" },
  ]
  for (const milestone of milestones) {
    const time = Date.parse(milestone.at)
    let closest = 0
    for (let index = 1; index < events.length; index++) {
      if (events[index].source !== "ui") continue
      if (Math.abs(Date.parse(events[index].at) - time) < Math.abs(Date.parse(events[closest].at) - time)) closest = index
    }
    events[closest] = { ...milestone, at: events[closest].at }
  }

  return events.map((event, index) => ({ id: `AUD-${String(HISTORY_SIZE - index).padStart(5, "0")}`, ...event }))
}

defineCollection(AUDIT_COLLECTION, buildHistory)

export function auditEvents(): Row[] {
  return collection(AUDIT_COLLECTION)
}

// ─── Session events ──────────────────────────────────────────────────────────

let sessionCount = 0

const VERBS: Record<string, string> = {
  post: "Posted",
  submit: "Submitted",
  approve: "Approved",
  reverse: "Reversed",
  "send-back": "Sent back",
  lock: "Locked",
  close: "Closed",
  reopen: "Reopened",
  file: "Filed",
  settle: "Settled",
  cancel: "Cancelled",
  run: "Ran",
  match: "Matched",
  unmatch: "Unmatched",
  dismiss: "Dismissed",
  finish: "Reconciled",
  resolve: "Resolved",
  refresh: "Refreshed",
  fix: "Fixed",
  dispose: "Disposed",
  "write-off": "Wrote off",
  edit: "Edited",
  lines: "Edited",
  toggle: "Changed",
  skip: "Changed",
  status: "Updated",
  unallocate: "Unallocated",
  "accept-all": "Accepted matches on",
  entry: "Created entry for",
  "renew-seal": "Renewed",
  "map-items": "Mapped items for",
  "submit-batch": "Submitted",
  "resubmit-group": "Resubmitted",
  steps: "Completed",
}

/** Section → what the object is called and where it opens. */
const OBJECTS: [RegExp, string, ((id: string) => string | null) | null][] = [
  [/^journals/, "Journal entry", (id) => `/finance/journals/${id}`],
  [/^assets\/depreciation/, "Depreciation run", () => "/finance/assets/depreciation"],
  [/^assets\/categories/, "Asset category", () => "/finance/assets/categories"],
  [/^assets/, "Asset", (id) => `/finance/assets/${id}`],
  [/^budgets/, "Budget", (id) => `/finance/budgets/${id}`],
  [/^cost-centers/, "Cost center", (id) => `/finance/cost-centers/${id}`],
  [/^allocation-rules/, "Allocation rule", () => "/finance/allocation-rules"],
  [/^dimensions/, "Dimension", () => "/finance/dimensions"],
  [/^(receipts|payments|ar\/receipts)/, "Voucher", null],
  [/^ap\/approvals/, "Bill", null],
  [/^ap\/payment-runs/, "Payment run", () => "/finance/ap/payment-runs"],
  [/^(ar|ap)/, "Subledger document", null],
  [/^expenses/, "Expense claim", () => "/finance/expenses"],
  [/^treasuries/, "Treasury", (id) => `/finance/treasuries/${id}`],
  [/^transfers/, "Transfer", () => "/finance/transfers"],
  [/^cheques\/books/, "Cheque book", () => "/finance/cheques/books"],
  [/^cheques/, "Cheque", null],
  [/^custody/, "Custody", (id) => `/finance/custody/${id}`],
  [/^reconciliation\/imports/, "Bank statement", () => "/finance/reconciliation"],
  [/^reconciliation/, "Bank reconciliation", (id) => `/finance/reconciliation/${id}`],
  [/^close\/periods/, "Financial period", () => "/finance/periods"],
  [/^close\/year-end/, "Year-end close", () => "/finance/periods/year-end"],
  [/^close/, "Close task", () => "/finance/close"],
  [/^tax\/vat-returns/, "VAT return", () => "/finance/tax/vat-return"],
  [/^tax\/e-invoicing\/(submit-batch|resubmit-group|map-items|renew-seal)/, "E-invoicing", () => "/finance/tax/e-invoicing"],
  [/^tax\/e-invoicing/, "E-document", (id) => `/finance/tax/e-invoicing/${id}`],
  [/^tax\/withholding/, "WHT certificate", () => "/finance/tax/withholding"],
  [/^tax\/declarations/, "Tax declaration", () => "/finance/tax/declarations"],
  [/^tax\/codes/, "Tax code", () => "/finance/tax/codes"],
  [/^tax\/audit-files/, "Audit file", () => "/finance/tax/audit-files"],
  [/^ledger\/recurring/, "Recurring journal", () => "/finance/recurring"],
  [/^ledger\/templates/, "Journal template", () => "/finance/templates"],
  [/^ledger\/opening-balances/, "Opening balances", () => "/finance/opening-balances"],
  [/^ledger\/fx-revaluation/, "FX revaluation", () => "/finance/fx-revaluation"],
  [/^ledger\/import/, "Data import", () => "/finance/import"],
  [/^currencies/, "Exchange rates", () => "/finance/currencies"],
  [/^settings\/posting-map/, "Posting map", () => "/finance/settings/posting-map"],
  [/^settings/, "Finance setting", null],
  [/^setup/, "Finance setup", () => "/finance/setup"],
]

/** Writes that change nothing on the books are not audited. */
const SKIP = /^\/finance\/(assistant|nav-counts|search)|\/(export|preview|simulate)(\/|$)/

function describe(route: DemoRoute, req: DemoRequest, data: unknown): Omit<AuditEvent, "at" | "actor"> {
  const path = route.pattern.replace(/^\/finance\//, "")
  const section = path
    .split("/")
    .filter((part) => !part.startsWith(":"))
  const last = section[section.length - 1]
  const idVar = Object.values(req.vars)[0] ?? ""
  const verb = VERBS[last] ?? (req.method === "put" ? "Updated" : Object.keys(req.vars).length ? "Updated" : "Created")
  const match = OBJECTS.find(([pattern]) => pattern.test(path))
  const objectType = match?.[1] ?? "Finance record"
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>
  const label = String(record.number ?? record.code ?? (idVar || record.name || record.period || record.id || ""))
  const hrefId = String(record.id ?? idVar ?? "")
  const href = match?.[2] ? match[2](hrefId) : null
  return {
    action: `${verb} ${objectType.charAt(0).toLowerCase()}${objectType.slice(1)}`,
    object_type: objectType,
    object: label || objectType,
    href,
    source: /import/.test(path) ? "import" : "ui",
  }
}

/** Wrap every write route so a successful call leaves an audit event. */
export function withAudit(routes: DemoRoute[]): DemoRoute[] {
  return routes.map((route) => {
    if (route.method === "get" || SKIP.test(route.pattern)) return route
    return {
      ...route,
      handler: (req: DemoRequest) => {
        const result = route.handler(req) as DemoResult
        const status = typeof result === "object" && result && "status" in result ? Number(result.status ?? 200) : 200
        if (status < 400) {
          sessionCount++
          const at = new Date(Date.parse(FIN_NOW) + sessionCount * 60_000).toISOString()
          createRow(AUDIT_COLLECTION, { id: `AUD-S${String(sessionCount).padStart(4, "0")}`, at, actor: FIN_ACTOR, ...describe(route, req, result?.data) })
        }
        return result
      },
    }
  })
}
