import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_CLOSING_PERIOD, FIN_TODAY } from "../../seed/finance/calendar"
import {
  APPROVER_LADDERS,
  DEMO_PERSONAS,
  FIN_SETUP_INDUSTRIES,
  PERMISSIONS,
  POLICY_TYPES,
  SETUP_DIMENSION_VALUES,
} from "../../seed/finance/configuration"
import { FIN_ACTOR } from "../../seed/finance/ledger"
import { nextEntry } from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"
import { journalTotals, storedJournals } from "./ledger-model"
import { pendingBills } from "./payables"

/** 11 · Configuration — setup, posting map and simulator, calendar, numbering, approvals and roles. */

const r2 = (value: number) => Math.round(value * 100) / 100
const refuse = (message: string) => ({ status: 422, data: { message } })

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const INPUT_VAT_ACCOUNT = "110601"
/** Accounts a document settles against; the other side of a rule carries the tax. */
const CONTROL_ACCOUNT = /^(1101|1102|110301|110302|210101)/
/** Modules whose tax is recoverable input tax rather than tax charged to customers. */
const PURCHASE_MODULES = new Set(["AP", "ASSETS", "INVENTORY", "CASH"])

type RuleSide = { debit_account: string | null; credit_account: string | null; tax_code: string | null }

function settings(): Row {
  return findRow(FIN_COLLECTIONS.financeSettings, "settings") as Row
}

function accountName(code: string | null): string | null {
  return code ? String(findRow(FIN_COLLECTIONS.accounts, code)?.name ?? code) : null
}

function presentSide(side: RuleSide) {
  const tax = side.tax_code ? findRow(FIN_COLLECTIONS.taxCodes, side.tax_code) : null
  return {
    ...side,
    debit_name: accountName(side.debit_account),
    credit_name: accountName(side.credit_account),
    tax_rate: tax ? Number(tax.rate) : null,
  }
}

function presentRule(rule: Row) {
  return {
    id: rule.id,
    code: rule.code,
    event: rule.event,
    module: rule.module,
    description: rule.description,
    current: presentSide(rule.current as RuleSide),
    staged: rule.staged ? presentSide(rule.staged as RuleSide) : null,
    per_month: rule.per_month,
    monthly_value: rule.monthly_value,
    changed_on: rule.changed_on,
    changed_by: rule.changed_by,
  }
}

function postingMap() {
  const rules = collection(FIN_COLLECTIONS.postingRules)
  const staged = rules.filter((rule) => rule.staged)
  return {
    rules: rules.map(presentRule),
    staged_count: staged.length,
    staged_events: staged.map((rule) => String(rule.event)),
    staged_documents: staged.reduce((sum, rule) => sum + Number(rule.per_month), 0),
    staged_value: r2(staged.reduce((sum, rule) => sum + Number(rule.monthly_value), 0)),
    tax_codes: collection(FIN_COLLECTIONS.taxCodes).map((row) => ({ code: row.code, name: row.name, rate: Number(row.rate), kind: row.kind })),
  }
}

const sameSide = (a: RuleSide, b: RuleSide) => a.debit_account === b.debit_account && a.credit_account === b.credit_account && a.tax_code === b.tax_code

/**
 * The entry the posting engine would make for one document through a rule:
 * tax sits beside the revenue or expense account, and the control account
 * takes the gross. Withholding moves only the withheld share.
 */
function simulate(rule: Row, side: RuleSide, amount: number, inclusive: boolean) {
  const missing = !side.debit_account ? "debit" : !side.credit_account ? "credit" : null
  if (missing) {
    return { refused: `${String(rule.event)} has no ${missing} account, so the posting engine would refuse the document. Route it in the posting map before publishing.`, lines: [] }
  }
  const debit = String(side.debit_account)
  const credit = String(side.credit_account)
  const tax = side.tax_code ? findRow(FIN_COLLECTIONS.taxCodes, side.tax_code) : null
  const rate = tax ? Number(tax.rate) / 100 : 0
  const lines: { account_code: string; debit: number; credit: number }[] = []
  if (!tax || rate === 0) {
    lines.push({ account_code: debit, debit: amount, credit: 0 }, { account_code: credit, debit: 0, credit: amount })
  } else if (tax.kind === "withholding") {
    const withheld = r2(amount * rate)
    lines.push({ account_code: debit, debit: withheld, credit: 0 }, { account_code: credit, debit: 0, credit: withheld })
  } else {
    const taxAccount = PURCHASE_MODULES.has(String(rule.module)) ? INPUT_VAT_ACCOUNT : (tax.account_code as string | null)
    if (!taxAccount) {
      return { refused: `Tax code ${String(tax.code)} routes to no account, so the engine cannot book the tax. Route it under Tax codes first.`, lines: [] }
    }
    const net = inclusive ? r2(amount / (1 + rate)) : amount
    const taxAmount = r2(inclusive ? amount - net : net * rate)
    const gross = r2(net + taxAmount)
    // Tax goes on the side of the non-control account; the control side takes the gross.
    const debitIsControl = CONTROL_ACCOUNT.test(debit) && !CONTROL_ACCOUNT.test(credit)
    if (debitIsControl) {
      lines.push({ account_code: debit, debit: gross, credit: 0 }, { account_code: credit, debit: 0, credit: net }, { account_code: taxAccount, debit: 0, credit: taxAmount })
    } else {
      lines.push({ account_code: debit, debit: net, credit: 0 }, { account_code: taxAccount, debit: taxAmount, credit: 0 }, { account_code: credit, debit: 0, credit: gross })
    }
  }
  const named = lines.map((line) => ({ ...line, name: accountName(line.account_code) }))
  const totalDebit = r2(named.reduce((sum, line) => sum + line.debit, 0))
  const totalCredit = r2(named.reduce((sum, line) => sum + line.credit, 0))
  return { refused: null, lines: named, debit: totalDebit, credit: totalCredit, difference: r2(totalDebit - totalCredit) }
}

function ensureDimension(name: string, values: string[]) {
  const existing = collection(FIN_COLLECTIONS.dimensions)
  if (existing.some((row) => String(row.name).toLowerCase() === name.toLowerCase())) return false
  let serial = existing.length + 1
  while (findRow(FIN_COLLECTIONS.dimensions, `D${serial}`)) serial++
  createRow(FIN_COLLECTIONS.dimensions, { id: `D${serial}`, code: `D${serial}`, name, name_ar: name, values, postings: 0, required: false })
  const rows = collection(FIN_COLLECTIONS.dimensions)
  rows.push(rows.shift() as Row)
  return true
}

function dimensionValues(analysedBy: string): string[] {
  const centers = collection(FIN_COLLECTIONS.costCenters)
  if (analysedBy === "Project") return centers.filter((row) => row.type === "project" && row.parent_id).map((row) => String(row.name))
  if (analysedBy === "Branch") return centers.filter((row) => row.type === "branch").map((row) => String(row.name))
  return SETUP_DIMENSION_VALUES[analysedBy] ?? []
}

function setupSummary() {
  const current = settings()
  const setup = current.setup as Row | null
  const industry = setup ? FIN_SETUP_INDUSTRIES.find((row) => row.id === setup.industry) : null
  const entity = setup ? findRow(FIN_COLLECTIONS.entities, String(setup.entity_id)) : null
  const fiscal = current.fiscal as Row
  const decisions = industry
    ? [
        { setting: "Company", value: String(entity?.name ?? setup?.entity_id), because: "Each company keeps its own ledger and its own reports.", href: "/finance" },
        { setting: "Financial year starts", value: `1 ${MONTHS[Number(fiscal.year_start_month) - 1]}`, because: "Twelve monthly periods are created from this date, and you close them one at a time.", href: "/finance/settings/fiscal-calendar" },
        ...industry.decisions,
      ]
    : []
  return {
    completed: Boolean(setup),
    completed_at: setup?.completed_at ?? null,
    choices: setup ? { industry: setup.industry, entity_id: setup.entity_id, year_start_month: fiscal.year_start_month } : null,
    industry: industry ? { id: industry.id, name: industry.name, analysed_by: industry.analysed_by, tax_codes: industry.tax_codes } : null,
    decisions,
    industries: FIN_SETUP_INDUSTRIES,
    entities: collection(FIN_COLLECTIONS.entities).map((row) => ({ id: row.id, name: row.name })),
    dimension_created: setup?.dimension_created ?? false,
  }
}

/** Highest serial in use for a numbered document, and how many there are. */
function sequence(numbers: string[], digits: number) {
  const serials = numbers.map((number) => Number(String(number).split("-").pop())).filter((value) => Number.isFinite(value))
  const last = serials.reduce((max, value) => Math.max(max, value), 0)
  return { count: serials.length, last: last || null, next: String(last + 1).padStart(digits, "0") }
}

function presentPolicy(policy: Row) {
  const threshold = policy.threshold === null ? null : Number(policy.threshold)
  let waiting: number | null = null
  if (policy.type === "journal") {
    waiting = storedJournals().filter((row) => row.status === "pending" && (threshold === null || journalTotals(row).debit_base > threshold)).length
  } else if (policy.type === "bill") {
    waiting = pendingBills().filter((row) => threshold === null || Number(row.gross) > threshold).length
  }
  return {
    ...policy,
    active: Boolean(policy.active),
    threshold,
    type_label: POLICY_TYPES.find((row) => row.value === policy.type)?.label ?? String(policy.type),
    waiting,
  }
}

export const financeConfigurationRoutes: DemoRoute[] = [
  // Setup
  route("get", "/finance/setup", () => ({ data: setupSummary() })),

  route("post", "/finance/setup", (req) => {
    const industry = FIN_SETUP_INDUSTRIES.find((row) => row.id === req.body.industry)
    const entity = findRow(FIN_COLLECTIONS.entities, String(req.body.entity_id ?? ""))
    const month = Math.trunc(Number(req.body.year_start_month))
    if (!industry) return refuse("Choose what the business does.")
    if (!entity) return refuse("Choose the company to set up.")
    if (!(month >= 1 && month <= 12)) return refuse("Choose the month the financial year starts.")
    const current = settings()
    const created = ensureDimension(industry.analysed_by, dimensionValues(industry.analysed_by))
    current.setup = { industry: industry.id, entity_id: entity.id, completed_at: FIN_TODAY, completed_by: FIN_ACTOR, dimension_created: created }
    current.fiscal = { ...(current.fiscal as Row), year_start_month: month }
    return { data: setupSummary() }
  }),

  // Posting map
  route("get", "/finance/settings/posting-map", () => ({ data: postingMap() })),

  route("post", "/finance/settings/posting-map/rules/:id/stage", (req) => {
    const rule = findRow(FIN_COLLECTIONS.postingRules, req.vars.id)
    if (!rule) return { status: 404, data: null }
    const base = (rule.staged ?? rule.current) as RuleSide
    const next: RuleSide = {
      debit_account: req.body.debit_account === undefined ? base.debit_account : (req.body.debit_account as string | null) || null,
      credit_account: req.body.credit_account === undefined ? base.credit_account : (req.body.credit_account as string | null) || null,
      tax_code: req.body.tax_code === undefined ? base.tax_code : (req.body.tax_code as string | null) || null,
    }
    for (const code of [next.debit_account, next.credit_account]) {
      if (!code) continue
      const account = findRow(FIN_COLLECTIONS.accounts, code)
      if (!account || account.is_group) return refuse(`${code} is not a postable account.`)
    }
    if (next.debit_account && next.debit_account === next.credit_account) return refuse("Debit and credit cannot be the same account.")
    if (next.tax_code && !findRow(FIN_COLLECTIONS.taxCodes, next.tax_code)) return refuse(`There is no tax code ${next.tax_code}.`)
    rule.staged = sameSide(next, rule.current as RuleSide) ? null : next
    return { data: presentRule(rule) }
  }),

  route("post", "/finance/settings/posting-map/discard", () => {
    const staged = collection(FIN_COLLECTIONS.postingRules).filter((rule) => rule.staged)
    if (!staged.length) return refuse("There are no staged changes to discard.")
    for (const rule of staged) rule.staged = null
    return { data: postingMap() }
  }),

  route("post", "/finance/settings/posting-map/publish", () => {
    const staged = collection(FIN_COLLECTIONS.postingRules).filter((rule) => rule.staged)
    if (!staged.length) return refuse("Stage at least one change before publishing.")
    const unrouted = staged.find((rule) => !(rule.staged as RuleSide).credit_account)
    if (unrouted) return refuse(`${String(unrouted.event)} would have no credit account. Route it before publishing.`)
    for (const rule of staged) Object.assign(rule, { current: rule.staged, staged: null, changed_on: FIN_TODAY, changed_by: FIN_ACTOR })
    return { data: { ...postingMap(), published: staged.length, code: `${staged.length} ${staged.length === 1 ? "rule" : "rules"}` } }
  }),

  /** Read-only: the entry a document would post, against the current or staged map. */
  route("post", "/finance/settings/posting-map/simulate", (req) => {
    const rule = findRow(FIN_COLLECTIONS.postingRules, String(req.body.rule_id ?? ""))
    if (!rule) return refuse("Choose a document event.")
    const amount = r2(Number(req.body.amount))
    if (!(amount > 0)) return refuse("Enter an amount above zero.")
    const inclusive = Boolean(req.body.inclusive)
    const current = simulate(rule, rule.current as RuleSide, amount, inclusive)
    const staged = rule.staged ? simulate(rule, rule.staged as RuleSide, amount, inclusive) : null
    return { data: { rule: presentRule(rule), amount, inclusive, current, staged } }
  }),

  // Fiscal calendar
  route("get", "/finance/settings/fiscal-calendar", () => {
    const fiscal = settings().fiscal as Row
    const periods = collection(FIN_COLLECTIONS.periods)
      .filter((row) => String(row.id).startsWith(FIN_CLOSING_PERIOD.slice(0, 4)))
      .map((row) => {
        const end = new Date(`${String(row.end_date)}T00:00:00Z`)
        end.setUTCDate(end.getUTCDate() + Number(fiscal.adjusting_days))
        return { id: row.id, label: row.label, start_date: row.start_date, end_date: row.end_date, status: row.status, adjusting_until: end.toISOString().slice(0, 10) }
      })
    return {
      data: {
        ...fiscal,
        year_start_label: `1 ${MONTHS[Number(fiscal.year_start_month) - 1]}`,
        // The periods in use were created from January; a new start applies from next year.
        pending_change: Number(fiscal.year_start_month) !== 1,
        periods,
      },
    }
  }),

  route("post", "/finance/settings/fiscal-calendar", (req) => {
    const current = settings()
    const month = Math.trunc(Number(req.body.year_start_month ?? (current.fiscal as Row).year_start_month))
    const days = Math.trunc(Number(req.body.adjusting_days ?? (current.fiscal as Row).adjusting_days))
    if (!(month >= 1 && month <= 12)) return refuse("Choose the month the financial year starts.")
    if (!(days >= 0 && days <= 30)) return refuse("The adjusting window is between 0 and 30 days.")
    current.fiscal = { ...(current.fiscal as Row), year_start_month: month, adjusting_days: days }
    return { data: { ...(current.fiscal as Row), code: "Fiscal calendar" } }
  }),

  // Document numbering, read from what is actually in use
  route("get", "/finance/settings/numbering", () => {
    const ar = collection(FIN_COLLECTIONS.arDocuments)
    const ap = collection(FIN_COLLECTIONS.apDocuments)
    const numbers = (rows: Row[]) => rows.map((row) => String(row.number))
    const journalNext = nextEntry()
    const row = (id: string, document: string, format: string, found: ReturnType<typeof sequence>, next?: string) => ({
      id,
      document,
      format,
      count: found.count,
      next: next ?? format.replace("{YYYY}", "2026").replace(/\{#+\}/, found.next),
    })
    return {
      data: [
        row("journal", "Journal entry", "JE-{YYYY}-{######}", sequence(numbers(collection(FIN_COLLECTIONS.journals)), 6), journalNext),
        row("invoice", "Sales invoice", "INV-{YYYY}-{####}", sequence(numbers(ar.filter((doc) => doc.type === "invoice")), 4)),
        row("credit_note", "Credit note", "CN-{YYYY}-{####}", sequence(numbers(ar.filter((doc) => doc.type === "credit_note")), 4)),
        row("receipt", "Receipt voucher", "REC-{YYYY}-{####}", sequence(numbers(collection(FIN_COLLECTIONS.receipts)), 4)),
        row("payment", "Payment voucher", "PAY-{YYYY}-{####}", sequence(numbers(collection(FIN_COLLECTIONS.payments)), 4)),
        row("bill", "Supplier bill", "BILL-{YYYY}-{####}", sequence(numbers(ap.filter((doc) => doc.type === "bill")), 4)),
        row("e_document", "E-invoice (ETA)", "EG-{YYYY}-{#####}", sequence(numbers(collection(FIN_COLLECTIONS.eDocuments).filter((doc) => doc.authority === "ETA")), 5)),
        row("asset", "Fixed asset", "FA-{YYYY}-{###}", sequence(numbers(collection(FIN_COLLECTIONS.assets).filter((asset) => String(asset.number).startsWith("FA-2026-"))), 3)),
      ],
    }
  }),

  // Approval policies
  route("get", "/finance/settings/approvals", () => {
    const items = collection(FIN_COLLECTIONS.approvalPolicies).map(presentPolicy)
    return { data: { items, active: items.filter((row) => row.active).length, types: POLICY_TYPES } }
  }),

  route("post", "/finance/settings/approvals", (req) => {
    const name = String(req.body.name ?? "").trim()
    const type = String(req.body.type ?? "")
    const threshold = req.body.threshold === null || req.body.threshold === "" || Number(req.body.threshold) === 0 ? null : r2(Number(req.body.threshold))
    const approvers = Math.trunc(Number(req.body.approvers))
    const ladder = APPROVER_LADDERS[type]
    if (!name) return refuse("Name the policy.")
    if (!ladder) return refuse("Choose what the policy applies to.")
    if (threshold !== null && !(threshold > 0)) return refuse("The threshold is an amount above zero, or zero for any amount.")
    if (!(approvers >= 1 && approvers <= ladder.length)) return refuse(`A ${type.replace("_", " ")} policy takes between 1 and ${ladder.length} approvers.`)
    let serial = collection(FIN_COLLECTIONS.approvalPolicies).length + 1
    while (findRow(FIN_COLLECTIONS.approvalPolicies, `APP-${serial}`)) serial++
    const policy = createRow(FIN_COLLECTIONS.approvalPolicies, { id: `APP-${serial}`, code: `APP-${serial}`, name, type, threshold, approvers: ladder.slice(0, approvers), active: true })
    const rows = collection(FIN_COLLECTIONS.approvalPolicies)
    rows.push(rows.shift() as Row)
    return { data: presentPolicy(policy) }
  }),

  // Roles
  route("get", "/finance/settings/roles", () => {
    const persona = DEMO_PERSONAS.find((row) => row.id === settings().persona) ?? DEMO_PERSONAS[0]
    return {
      data: {
        items: collection(FIN_COLLECTIONS.roles),
        permissions: PERMISSIONS,
        personas: DEMO_PERSONAS,
        persona: persona.id,
        persona_role: findRow(FIN_COLLECTIONS.roles, persona.role_id) ?? null,
      },
    }
  }),

  route("post", "/finance/settings/roles/persona", (req) => {
    const persona = DEMO_PERSONAS.find((row) => row.id === req.body.persona)
    if (!persona) return refuse("Choose a role to preview.")
    settings().persona = persona.id
    return { data: { code: persona.name } }
  }),

  route("post", "/finance/settings/roles", (req) => {
    const name = String(req.body.name ?? "").trim()
    const scope = ["Entity", "Cost center", "Treasury"].includes(String(req.body.scope)) ? String(req.body.scope) : "Entity"
    if (!name) return refuse("Name the role.")
    if (collection(FIN_COLLECTIONS.roles).some((row) => String(row.name).toLowerCase() === name.toLowerCase())) return refuse(`A role called ${name} already exists.`)
    let serial = collection(FIN_COLLECTIONS.roles).length + 1
    while (findRow(FIN_COLLECTIONS.roles, `R-${serial}`)) serial++
    const role = createRow(FIN_COLLECTIONS.roles, {
      id: `R-${serial}`,
      code: `R-${serial}`,
      name,
      scope,
      members: 0,
      permissions: {
        view: Boolean(req.body.may_see_balances),
        post: Boolean(req.body.may_post),
        approve: Boolean(req.body.may_approve),
        reverse: false,
        close: false,
        settings: false,
      },
    })
    const rows = collection(FIN_COLLECTIONS.roles)
    rows.push(rows.shift() as Row)
    return { data: role }
  }),
]
