import { collection, findRow, type Row } from "../../demo-db"
import { FIN_CLOSING_PERIOD } from "../../seed/finance/calendar"
import { plClass, type PlClass } from "../../seed/finance/planning"
import { FIN_COLLECTIONS } from "./collections"
import { postedLines } from "./ledger-model"

/**
 * Cost-center actuals for a fiscal year, read from posted P&L lines. A line
 * charged to a center counts there in full; any other line is spread across
 * the centers by their weight for the line's account class. Each account's
 * shares are rounded so they add back to the ledger to the cent.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

export const FISCAL_YEAR = FIN_CLOSING_PERIOD.slice(0, 4)

export function costCenters(): Row[] {
  return collection(FIN_COLLECTIONS.costCenters)
}

function spread(cls: PlClass): [string, number][] {
  const weighted = costCenters()
    .map((row): [string, number] => [String(row.id), Number((row.weights as Record<string, number> | undefined)?.[cls] ?? 0)])
    .filter(([, weight]) => weight > 0)
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
  return weighted.map(([id, weight]) => [id, weight / total])
}

export type CenterActuals = {
  revenue: number
  expense: number
  /** Per account, revenue as a positive amount and expense as a positive amount. */
  accounts: { code: string; kind: "revenue" | "expense"; amount: number }[]
}

export function centerActuals(year = FISCAL_YEAR): Map<string, CenterActuals> {
  // account → center → debit-positive amount, unrounded; and each account's exact ledger total.
  const shares = new Map<string, Map<string, number>>()
  const totals = new Map<string, number>()
  const spreads = new Map<PlClass, [string, number][]>()
  for (const line of postedLines()) {
    if (!line.date.startsWith(year)) continue
    const cls = plClass(line.account_code)
    if (!cls) continue
    const amount = line.debit - line.credit
    totals.set(line.account_code, r2((totals.get(line.account_code) ?? 0) + amount))
    if (!spreads.has(cls)) spreads.set(cls, spread(cls))
    const targets: [string, number][] = line.cost_center ? [[line.cost_center, 1]] : (spreads.get(cls) ?? [])
    const byCenter = shares.get(line.account_code) ?? new Map<string, number>()
    for (const [id, share] of targets) byCenter.set(id, (byCenter.get(id) ?? 0) + amount * share)
    shares.set(line.account_code, byCenter)
  }

  const result = new Map<string, CenterActuals>()
  const bucket = (id: string) => {
    const current = result.get(id) ?? { revenue: 0, expense: 0, accounts: [] }
    result.set(id, current)
    return current
  }
  for (const [code, byCenter] of shares) {
    const rounded = [...byCenter].map(([id, value]): [string, number] => [id, r2(value)])
    const residual = r2((totals.get(code) ?? 0) - rounded.reduce((sum, [, value]) => sum + value, 0))
    if (residual !== 0 && rounded.length) {
      const largest = rounded.reduce((best, entry, index) => (Math.abs(entry[1]) > Math.abs(rounded[best][1]) ? index : best), 0)
      rounded[largest] = [rounded[largest][0], r2(rounded[largest][1] + residual)]
    }
    const kind = code.startsWith("4") ? "revenue" : "expense"
    for (const [id, value] of rounded) {
      if (value === 0) continue
      const center = bucket(id)
      const amount = kind === "revenue" ? -value : value
      center.accounts.push({ code, kind, amount })
      if (kind === "revenue") center.revenue = r2(center.revenue + amount)
      else center.expense = r2(center.expense + amount)
    }
  }
  return result
}

/** The center and every center below it. */
export function subtree(id: string): string[] {
  const ids = [id]
  for (let index = 0; index < ids.length; index++) {
    for (const row of costCenters()) if (row.parent_id === ids[index]) ids.push(String(row.id))
  }
  return ids
}

export function topLevelOf(id: string): string {
  let current = findRow(FIN_COLLECTIONS.costCenters, id)
  while (current?.parent_id) current = findRow(FIN_COLLECTIONS.costCenters, String(current.parent_id))
  return String(current?.id ?? id)
}

export function presentCenter(row: Row, actuals: Map<string, CenterActuals>): Row {
  const own = actuals.get(String(row.id)) ?? { revenue: 0, expense: 0 }
  const contribution = r2(own.revenue - own.expense)
  let depth = 0
  let parent = row.parent_id ? findRow(FIN_COLLECTIONS.costCenters, String(row.parent_id)) : undefined
  while (parent) {
    depth++
    parent = parent.parent_id ? findRow(FIN_COLLECTIONS.costCenters, String(parent.parent_id)) : undefined
  }
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    name_ar: row.name_ar ?? null,
    type: row.type ?? "department",
    parent_id: row.parent_id ?? null,
    status: row.status ?? "active",
    depth,
    revenue: own.revenue,
    expense: own.expense,
    contribution,
    margin: own.revenue ? Math.round((contribution / own.revenue) * 100) : null,
  }
}

/** Centers in hierarchy order: each parent followed by its children, by code. */
export function orderedCenters(): Row[] {
  const rows = [...costCenters()].sort((a, b) => String(a.code).localeCompare(String(b.code)))
  const out: Row[] = []
  const visit = (parent: string | null) => {
    for (const row of rows.filter((entry) => (entry.parent_id ?? null) === parent)) {
      out.push(row)
      visit(String(row.id))
    }
  }
  visit(null)
  // Anything whose parent is missing (e.g. an imported row) still shows.
  for (const row of rows) if (!out.includes(row)) out.push(row)
  return out
}

/** Months of the year the budget has run so far, for year-to-date comparisons. */
export function monthsElapsed(year: number): number {
  const closingYear = Number(FIN_CLOSING_PERIOD.slice(0, 4))
  if (year < closingYear) return 12
  if (year > closingYear) return 0
  return Number(FIN_CLOSING_PERIOD.slice(5, 7))
}
