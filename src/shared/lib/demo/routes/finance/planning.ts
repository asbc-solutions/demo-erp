import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_CLOSING_PERIOD, FIN_TODAY } from "../../seed/finance/calendar"
import { FIN_ACTOR } from "../../seed/finance/ledger"
import { ALLOCATION_BASES } from "../../seed/finance/planning"
import { periodProblem } from "./close-model"
import { FIN_COLLECTIONS } from "./collections"
import { createJournal, postedLines, type JournalLine } from "./ledger-model"
import {
  FISCAL_YEAR,
  centerActuals,
  costCenters,
  monthsElapsed,
  orderedCenters,
  presentCenter,
  subtree,
  topLevelOf,
  type CenterActuals,
} from "./planning-model"

/** 09 · Planning — budgets against actuals, cost centers, dimensions and allocation rules. */

const r2 = (value: number) => Math.round(value * 100) / 100
const refuse = (message: string) => ({ status: 422, data: { message } })

function centerName(id: string): string {
  return String(findRow(FIN_COLLECTIONS.costCenters, id)?.name ?? id)
}

function accountName(code: string): string {
  return String(findRow(FIN_COLLECTIONS.accounts, code)?.name ?? code)
}

function rolledUp(actuals: Map<string, CenterActuals>, id: string) {
  return subtree(id).reduce(
    (sum, member) => {
      const own = actuals.get(member)
      return { revenue: r2(sum.revenue + (own?.revenue ?? 0)), expense: r2(sum.expense + (own?.expense ?? 0)) }
    },
    { revenue: 0, expense: 0 },
  )
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

function budgetLines(budget: Record<string, unknown>) {
  return (budget.lines as { cost_center_id: string; annual: number }[]) ?? []
}

function presentBudget(budget: Row) {
  const year = Number(budget.year)
  const elapsed = monthsElapsed(year)
  const actuals = String(year) === FISCAL_YEAR ? centerActuals(String(year)) : new Map<string, CenterActuals>()
  const lines = budgetLines(budget).map((line) => {
    const budgeted = r2((Number(line.annual) * elapsed) / 12)
    const actual = rolledUp(actuals, line.cost_center_id).expense
    return {
      id: line.cost_center_id,
      cost_center_id: line.cost_center_id,
      name: centerName(line.cost_center_id),
      annual: Number(line.annual),
      budgeted,
      actual,
      variance: r2(budgeted - actual),
      used: budgeted ? Math.round((actual / budgeted) * 100) : null,
    }
  })
  const total = (key: "annual" | "budgeted" | "actual" | "variance") => r2(lines.reduce((sum, row) => sum + row[key], 0))
  const expenseAccounts = collection(FIN_COLLECTIONS.accounts).filter((row) => !row.is_group && /^[56]/.test(String(row.code))).length
  return {
    id: budget.id,
    code: budget.code,
    name: budget.name,
    year,
    status: budget.status,
    scope: budget.scope,
    scope_label: `${lines.length} cost ${lines.length === 1 ? "center" : "centers"} · ${expenseAccounts} expense accounts`,
    months_elapsed: elapsed,
    total: total("annual"),
    budgeted: total("budgeted"),
    actual: total("actual"),
    variance: total("variance"),
    approved_by: budget.approved_by ?? null,
    approved_on: budget.approved_on ?? null,
    locked_by: budget.locked_by ?? null,
    locked_on: budget.locked_on ?? null,
    lines,
  }
}

// ─── Allocation rules ────────────────────────────────────────────────────────

type Target = { cost_center_id: string; weight: number }

function presentRule(rule: Row) {
  const runs = (rule.runs as Row[]) ?? []
  const ran = runs.find((run) => run.period === FIN_CLOSING_PERIOD)
  const targets = (rule.targets as Target[]).map((row) => ({ ...row, name: centerName(row.cost_center_id) }))
  return {
    id: rule.id,
    code: rule.code,
    name: rule.name,
    basis: rule.basis,
    basis_label: ALLOCATION_BASES.find((row) => row.value === rule.basis)?.label ?? String(rule.basis),
    source_accounts: (rule.source_accounts as string[]).map((code) => ({ code, name: accountName(code) })),
    targets,
    weights_total: targets.reduce((sum, row) => sum + row.weight, 0),
    active: Boolean(rule.active),
    status: !rule.active ? "inactive" : ran ? "posted" : "ready",
    last_run: ran ?? runs[runs.length - 1] ?? null,
  }
}

/** Parse "CC-110:20, CC-210:35" (or an array of pairs) into targets. */
function parseTargets(input: unknown): Target[] | string {
  const pairs: [string, number][] = Array.isArray(input)
    ? (input as Row[]).map((row) => [String(row.cost_center_id ?? ""), Number(row.weight)])
    : String(input ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const [code, weight] = part.split(":").map((piece) => piece.trim())
          return [code.toUpperCase(), Number(weight)]
        })
  if (!pairs.length) return "Add at least one target cost center."
  for (const [code, weight] of pairs) {
    if (!findRow(FIN_COLLECTIONS.costCenters, code)) return `There is no cost center ${code || "with an empty code"}.`
    if (!(weight > 0)) return `Give ${code} a weight above zero.`
  }
  if (new Set(pairs.map(([code]) => code)).size !== pairs.length) return "Each cost center can appear once."
  const total = r2(pairs.reduce((sum, [, weight]) => sum + weight, 0))
  if (total !== 100) return `Weights total ${total}%. They must total 100%.`
  return pairs.map(([cost_center_id, weight]) => ({ cost_center_id, weight }))
}

function parseAccounts(input: unknown): string[] | string {
  const codes = (Array.isArray(input) ? input.map(String) : String(input ?? "").split(","))
    .map((part) => part.trim().split(/\s|·/)[0])
    .filter(Boolean)
  if (!codes.length) return "Add at least one source account."
  for (const code of codes) {
    const account = findRow(FIN_COLLECTIONS.accounts, code)
    if (!account || account.is_group) return `${code} is not a postable account.`
    if (!/^[56]/.test(code)) return `${code} is not an expense account. Only costs are allocated.`
  }
  return [...new Set(codes)]
}

function ruleInput(body: Record<string, unknown>, existing?: Row) {
  const name = String(body.name ?? existing?.name ?? "").trim()
  if (!name) return "Name the rule."
  const accounts = parseAccounts(body.source_accounts ?? existing?.source_accounts)
  if (typeof accounts === "string") return accounts
  const targets = parseTargets(body.targets ?? existing?.targets)
  if (typeof targets === "string") return targets
  const basis = ALLOCATION_BASES.some((row) => row.value === body.basis) ? String(body.basis) : String(existing?.basis ?? "fixed")
  return { name, source_accounts: accounts, targets, basis, active: body.active === undefined ? Boolean(existing?.active ?? true) : Boolean(body.active) }
}

/** What is still unassigned on an account in the period: the pool a rule spreads. */
function unassignedPool(code: string, period: string): number {
  return r2(
    postedLines()
      .filter((line) => line.account_code === code && line.period === period && !line.cost_center)
      .reduce((sum, line) => sum + line.debit - line.credit, 0),
  )
}

function monthEnd(period: string): string {
  const [year, month] = period.split("-").map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

export const financePlanningRoutes: DemoRoute[] = [
  // Budgets
  route("get", "/finance/budgets", () => {
    const items = collection(FIN_COLLECTIONS.budgets).map(presentBudget)
    return { data: { items, active: items.filter((row) => row.status !== "draft").length } }
  }),

  route("post", "/finance/budgets", (req) => {
    const name = String(req.body.name ?? "").trim()
    const year = Math.trunc(Number(req.body.year))
    const annual = r2(Number(req.body.annual))
    const scope = String(req.body.scope ?? "all")
    if (!name) return refuse("Name the budget.")
    if (!(year >= 2020 && year <= 2035)) return refuse("Enter the budget year.")
    if (!(annual > 0)) return refuse("Enter the annual budget above zero.")
    const tops = orderedCenters().filter((row) => !row.parent_id)
    const scoped = scope === "all" ? tops : tops.filter((row) => row.id === scope)
    if (!scoped.length) return refuse("Choose what the budget covers.")
    // Spread across the scope in the proportions of the current approved plan.
    const reference = new Map(budgetLines(findRow(FIN_COLLECTIONS.budgets, "BUD-2026") ?? {}).map((line) => [line.cost_center_id, Number(line.annual)]))
    const weights = scoped.map((row) => reference.get(String(row.id)) ?? 1)
    const weightTotal = weights.reduce((sum, value) => sum + value, 0)
    let assigned = 0
    const lines = scoped.map((row, index) => {
      const value = index === scoped.length - 1 ? r2(annual - assigned) : r2((annual * weights[index]) / weightTotal)
      assigned = r2(assigned + value)
      return { cost_center_id: String(row.id), annual: value }
    })
    const serial = collection(FIN_COLLECTIONS.budgets).filter((row) => Number(row.year) === year).length
    const code = serial ? `BUD-${year}-${serial + 1}` : `BUD-${year}`
    const budget = createRow(FIN_COLLECTIONS.budgets, { id: code, code, name, year, scope, status: "draft", lines, approved_by: null, approved_on: null, locked_by: null, locked_on: null })
    return { data: presentBudget(budget) }
  }),

  route("get", "/finance/budgets/:id", (req) => {
    const budget = findRow(FIN_COLLECTIONS.budgets, req.vars.id)
    return budget ? { data: presentBudget(budget) } : { status: 404, data: null }
  }),

  route("post", "/finance/budgets/:id/lines", (req) => {
    const budget = findRow(FIN_COLLECTIONS.budgets, req.vars.id)
    if (!budget) return { status: 404, data: null }
    if (budget.status !== "draft") return refuse("Only a draft budget can be edited. Draft a revision to change an approved plan.")
    const updates = new Map(((req.body.lines as Row[]) ?? []).map((row) => [String(row.cost_center_id), r2(Number(row.annual))]))
    for (const [id, value] of updates) if (!(value >= 0)) return refuse(`The budget for ${centerName(id)} must be zero or more.`)
    budget.lines = budgetLines(budget).map((line) => ({ ...line, annual: updates.get(line.cost_center_id) ?? line.annual }))
    return { data: presentBudget(budget) }
  }),

  route("post", "/finance/budgets/:id/approve", (req) => {
    const budget = findRow(FIN_COLLECTIONS.budgets, req.vars.id)
    if (!budget) return { status: 404, data: null }
    if (budget.status !== "draft") return refuse("This budget is already approved.")
    Object.assign(budget, { status: "approved", approved_by: FIN_ACTOR, approved_on: FIN_TODAY })
    return { data: presentBudget(budget) }
  }),

  route("post", "/finance/budgets/:id/lock", (req) => {
    const budget = findRow(FIN_COLLECTIONS.budgets, req.vars.id)
    if (!budget) return { status: 404, data: null }
    if (budget.status === "draft") return refuse("Approve the budget before locking it.")
    if (budget.status === "locked") return refuse("This budget is already locked.")
    Object.assign(budget, { status: "locked", locked_by: FIN_ACTOR, locked_on: FIN_TODAY })
    return { data: presentBudget(budget) }
  }),

  // Cost centers
  route("get", "/finance/cost-centers", () => {
    const actuals = centerActuals()
    const items = orderedCenters().map((row) => presentCenter(row, actuals))
    const revenue = r2(items.reduce((sum, row) => sum + Number(row.revenue), 0))
    const expense = r2(items.reduce((sum, row) => sum + Number(row.expense), 0))
    const contribution = r2(revenue - expense)
    return { data: { items, revenue, expense, contribution, margin: revenue ? Math.round((contribution / revenue) * 100) : null, year: FISCAL_YEAR } }
  }),

  route("post", "/finance/cost-centers", (req) => {
    const code = String(req.body.code ?? "").trim().toUpperCase()
    const name = String(req.body.name ?? "").trim()
    const nameAr = String(req.body.name_ar ?? "").trim()
    const type = ["department", "branch", "project"].includes(String(req.body.type)) ? String(req.body.type) : "department"
    const parent = req.body.parent_id ? String(req.body.parent_id) : null
    if (!/^CC-\d{3}$/.test(code)) return refuse("Cost center codes look like CC-900.")
    if (findRow(FIN_COLLECTIONS.costCenters, code)) return refuse(`${code} already exists. Choose another code.`)
    if (!name || !nameAr) return refuse("Give the cost center an English and an Arabic name.")
    if (parent && !findRow(FIN_COLLECTIONS.costCenters, parent)) return refuse("Choose an existing parent, or none.")
    const row = createRow(FIN_COLLECTIONS.costCenters, { id: code, code, name, name_ar: nameAr, type, parent_id: parent, status: "active", weights: {} })
    return { data: presentCenter(row, centerActuals()) }
  }),

  route("get", "/finance/cost-centers/:id", (req) => {
    const row = findRow(FIN_COLLECTIONS.costCenters, req.vars.id)
    if (!row) return { status: 404, data: null }
    const actuals = centerActuals()
    const children = costCenters()
      .filter((entry) => entry.parent_id === row.id)
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
      .map((entry) => {
        const totals = rolledUp(actuals, String(entry.id))
        return { ...presentCenter(entry, actuals), revenue: totals.revenue, expense: totals.expense, contribution: r2(totals.revenue - totals.expense) }
      })
    const accounts = (actuals.get(String(row.id))?.accounts ?? [])
      .map((entry) => ({ id: entry.code, code: entry.code, name: accountName(entry.code), kind: entry.kind, amount: entry.amount }))
      .sort((a, b) => (a.kind === b.kind ? b.amount - a.amount : a.kind === "revenue" ? -1 : 1))
    const top = topLevelOf(String(row.id))
    const budget = collection(FIN_COLLECTIONS.budgets).find(
      (entry) => String(entry.year) === FISCAL_YEAR && entry.status !== "draft" && budgetLines(entry).some((line) => line.cost_center_id === top),
    )
    const parent = row.parent_id ? findRow(FIN_COLLECTIONS.costCenters, String(row.parent_id)) : null
    return {
      data: {
        ...presentCenter(row, actuals),
        parent: parent ? { id: parent.id, code: parent.code, name: parent.name } : null,
        children,
        accounts,
        budget_id: budget?.id ?? null,
        year: FISCAL_YEAR,
      },
    }
  }),

  // Dimensions
  route("get", "/finance/dimensions", () => {
    const items = collection(FIN_COLLECTIONS.dimensions).map((row) => ({
      ...row,
      values: Array.isArray(row.values) ? row.values : [],
      postings: Number(row.postings ?? 0),
      required: Boolean(row.required),
    }))
    return {
      data: {
        items,
        required: items.filter((row) => row.required).length,
        values: items.reduce((sum, row) => sum + (row.values as unknown[]).length, 0),
      },
    }
  }),

  route("post", "/finance/dimensions", (req) => {
    const name = String(req.body.name ?? "").trim()
    const nameAr = String(req.body.name_ar ?? "").trim()
    const values = [...new Set((Array.isArray(req.body.values) ? req.body.values.map(String) : String(req.body.values ?? "").split(",")).map((value) => value.trim()).filter(Boolean))]
    if (!name || !nameAr) return refuse("Give the dimension an English and an Arabic name.")
    if (!values.length) return refuse("List at least one value, separated by commas.")
    const existing = collection(FIN_COLLECTIONS.dimensions)
    if (existing.some((row) => String(row.name).toLowerCase() === name.toLowerCase())) return refuse(`A dimension called ${name} already exists.`)
    let serial = existing.length + 1
    while (findRow(FIN_COLLECTIONS.dimensions, `D${serial}`)) serial++
    const row = createRow(FIN_COLLECTIONS.dimensions, { id: `D${serial}`, code: `D${serial}`, name, name_ar: nameAr, values, postings: 0, required: Boolean(req.body.required) })
    // Keep code order.
    const rows = collection(FIN_COLLECTIONS.dimensions)
    rows.push(rows.shift() as Row)
    return { data: row }
  }),

  // Allocation rules
  route("get", "/finance/allocation-rules", () => {
    const items = collection(FIN_COLLECTIONS.allocationRules).map(presentRule)
    const targets = new Set(items.flatMap((row) => row.targets.map((target) => target.cost_center_id)))
    return {
      data: {
        items,
        active: items.filter((row) => row.active).length,
        paused: items.filter((row) => !row.active).length,
        targets: targets.size,
        period: FIN_CLOSING_PERIOD,
        pending: items.filter((row) => row.status === "ready").length,
        bases: ALLOCATION_BASES,
      },
    }
  }),

  route("post", "/finance/allocation-rules", (req) => {
    const input = ruleInput(req.body)
    if (typeof input === "string") return refuse(input)
    let serial = collection(FIN_COLLECTIONS.allocationRules).length + 1
    while (findRow(FIN_COLLECTIONS.allocationRules, `AR-${serial}`)) serial++
    const rule = createRow(FIN_COLLECTIONS.allocationRules, { id: `AR-${serial}`, code: `AR-${serial}`, ...input, runs: [] })
    const rows = collection(FIN_COLLECTIONS.allocationRules)
    rows.push(rows.shift() as Row)
    return { data: presentRule(rule) }
  }),

  /** Spread each active rule's unassigned pool for the closing period onto its targets. */
  route("post", "/finance/allocation-rules/run", () => {
    const period = FIN_CLOSING_PERIOD
    const date = monthEnd(period)
    const closed = periodProblem(date)
    if (closed) return refuse(closed)
    const due = collection(FIN_COLLECTIONS.allocationRules).filter((rule) => rule.active && !((rule.runs as Row[]) ?? []).some((run) => run.period === period))
    if (!due.length) return refuse("Every active rule has already run for this period. Running again would double the allocation.")
    const posted: { rule: string; entry: string; amount: number }[] = []
    for (const rule of due) {
      const lines: JournalLine[] = []
      let total = 0
      for (const code of rule.source_accounts as string[]) {
        const pool = unassignedPool(code, period)
        if (pool <= 0) continue
        total = r2(total + pool)
        lines.push({ account_code: code, description: `${String(rule.code)} pool — ${accountName(code)}`, debit: 0, credit: pool, cost_center: null })
        const targets = rule.targets as Target[]
        let assigned = 0
        targets.forEach((target, index) => {
          const amount = index === targets.length - 1 ? r2(pool - assigned) : r2((pool * target.weight) / 100)
          assigned = r2(assigned + amount)
          lines.push({ account_code: code, description: `${String(rule.code)} to ${centerName(target.cost_center_id)}`, debit: amount, credit: 0, cost_center: target.cost_center_id })
        })
      }
      if (!lines.length) continue
      const journal = createJournal({
        date,
        description: `Allocation ${String(rule.code)} — ${String(rule.name)}`,
        lines,
        status: "posted",
        origin: "auto",
        source: String(rule.code),
        source_type: "allocation",
      })
      rule.runs = [...((rule.runs as Row[]) ?? []), { period, entry: journal.number, amount: total, date }]
      posted.push({ rule: String(rule.code), entry: String(journal.number), amount: total })
    }
    if (!posted.length) return refuse("There is nothing left to allocate: the source accounts have no unassigned cost this period.")
    return { data: { period, posted, total: r2(posted.reduce((sum, row) => sum + Number(row.amount), 0)) } }
  }),

  route("post", "/finance/allocation-rules/:id/toggle", (req) => {
    const rule = findRow(FIN_COLLECTIONS.allocationRules, req.vars.id)
    if (!rule) return { status: 404, data: null }
    rule.active = !rule.active
    return { data: presentRule(rule) }
  }),

  route("post", "/finance/allocation-rules/:id", (req) => {
    const rule = findRow(FIN_COLLECTIONS.allocationRules, req.vars.id)
    if (!rule) return { status: 404, data: null }
    const input = ruleInput(req.body, rule)
    if (typeof input === "string") return refuse(input)
    Object.assign(rule, input)
    return { data: presentRule(rule) }
  }),
]
