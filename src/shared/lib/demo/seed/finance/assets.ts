import type { Row } from "../../demo-db"

/**
 * Assets — the fixed-asset register behind property, plant and equipment.
 *
 * Each category has seven assets in service plus one disposed and one
 * written off (both derecognised earlier). In-service costs add up to the
 * design's category totals (8,942,000.00 in all) and accumulated depreciation
 * to the end of February adds up to 3,116,400.00, so the ledger's cost and
 * accumulated-depreciation accounts tie to the register. March is the
 * depreciation run still waiting to post.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

export const SALVAGE_SHARE = 0.05
/** Depreciation has been charged up to the end of this month. */
export const DEPRECIATED_TO = "2026-02"
const ACCUMULATED_TARGET = 3_116_400

export type AssetCategory = {
  id: string
  code: string
  name: string
  method: "straight_line" | "declining_balance"
  life: number
  cost_account: string
  accum_account: string
  target_cost: number
}

export const FIN_ASSET_CATEGORY_ROWS: AssetCategory[] = [
  { id: "AC-1", code: "AC-1", name: "Machinery and equipment", method: "straight_line", life: 120, cost_account: "120101", accum_account: "120201", target_cost: 4_820_000 },
  { id: "AC-2", code: "AC-2", name: "Vehicles", method: "declining_balance", life: 60, cost_account: "120103", accum_account: "120202", target_cost: 1_960_000 },
  { id: "AC-3", code: "AC-3", name: "Furniture and fixtures", method: "straight_line", life: 96, cost_account: "120102", accum_account: "120203", target_cost: 890_000 },
  { id: "AC-4", code: "AC-4", name: "Computers and IT equipment", method: "straight_line", life: 48, cost_account: "120104", accum_account: "120204", target_cost: 1_272_000 },
]

/** Relative cost weights per category, from the design's register (the last two are the disposed and written-off). */
const WEIGHTS: Record<string, number[]> = {
  "AC-1": [296_901.83, 364_411.5, 379_883.49, 464_335.22, 327_033.91, 372_911.01, 920_940.94, 914_332.82, 779_249.28],
  "AC-2": [160_052.65, 321_074.27, 308_217.01, 62_569.75, 227_914.57, 136_906.35, 287_510.68, 136_957.2, 318_797.52],
  "AC-3": [113_137.34, 141_663.37, 143_982.3, 39_059.03, 34_465.35, 59_451.28, 143_906.86, 88_400, 72_150],
  "AC-4": [130_550.4, 114_868.04, 75_144.59, 179_238.91, 139_498.11, 185_481.6, 90_251.6, 96_800, 118_400],
}

const LOCATIONS = [
  ["CC-100", "Cairo HQ · Head office"],
  ["CC-200", "10th of Ramadan · Plant"],
  ["CC-300", "Alexandria · Warehouse"],
  ["CC-400", "Cairo HQ · Sales"],
]

function monthsBetween(fromIso: string, toPeriod: string): number {
  const [fy, fm] = fromIso.slice(0, 7).split("-").map(Number)
  const [ty, tm] = toPeriod.split("-").map(Number)
  return Math.max(0, (ty - fy) * 12 + (tm - fm) + 1)
}

/** One month's charge given the method and what is left to depreciate. */
export function monthlyCharge(method: string, life: number, cost: number, salvage: number, accumulated: number): number {
  const remaining = r2(cost - salvage - accumulated)
  if (remaining <= 0) return 0
  const charge = method === "declining_balance" ? (cost - accumulated) * (2 / life) : (cost - salvage) / life
  return r2(Math.min(charge, remaining))
}

function formulaAccumulated(method: string, life: number, cost: number, salvage: number, months: number): number {
  let accumulated = 0
  for (let month = 0; month < months; month++) accumulated = r2(accumulated + monthlyCharge(method, life, cost, salvage, accumulated))
  return accumulated
}

export function buildAssets(): Row[] {
  const draft: Row[] = []
  for (const category of FIN_ASSET_CATEGORY_ROWS) {
    const weights = WEIGHTS[category.id]
    const inService = weights.slice(0, 7)
    const scale = category.target_cost / inService.reduce((sum, value) => sum + value, 0)
    let running = 0
    weights.forEach((weight, index) => {
      const n = index + 1
      const retired = n >= 8
      let cost = retired ? weight : r2(weight * scale)
      if (!retired && n === 7) cost = r2(category.target_cost - running)
      if (!retired) running = r2(running + cost)
      const serial = FIN_ASSET_CATEGORY_ROWS.indexOf(category) * 9 + n
      const inServiceDate = `2024-${String(n <= 8 ? n : 1).padStart(2, "0")}-15`
      const [centerId, location] = LOCATIONS[(serial - 1) % LOCATIONS.length]
      const salvage = r2(cost * SALVAGE_SHARE)
      draft.push({
        id: `FA-2024-${String(serial).padStart(3, "0")}`,
        number: `FA-2024-${String(serial).padStart(3, "0")}`,
        name: `${category.name} ${n}`,
        category_id: category.id,
        method: category.method,
        life: category.life,
        in_service: inServiceDate,
        cost,
        salvage,
        accumulated: formulaAccumulated(category.method, category.life, cost, salvage, monthsBetween(inServiceDate, DEPRECIATED_TO)),
        cost_center_id: centerId,
        location,
        status: n === 8 ? "disposed" : n === 9 ? "written_off" : "in_service",
        retired_on: n === 8 ? "2026-02-18" : n === 9 ? "2025-11-30" : null,
        history: [{ date: inServiceDate, event: "Placed in service", amount: cost, entry: null }],
      })
    })
  }

  // Scale in-service accumulated depreciation to the ledger's figure, keeping each within its limit.
  const active = draft.filter((row) => row.status === "in_service")
  const formulaTotal = active.reduce((sum, row) => sum + Number(row.accumulated), 0)
  const factor = ACCUMULATED_TARGET / formulaTotal
  let assigned = 0
  active.forEach((row, index) => {
    const ceiling = r2(Number(row.cost) - Number(row.salvage))
    const value = index === active.length - 1 ? r2(ACCUMULATED_TARGET - assigned) : r2(Math.min(ceiling, Number(row.accumulated) * factor))
    row.accumulated = value
    assigned = r2(assigned + value)
  })
  // Retired assets were derecognised: nothing carried.
  for (const row of draft.filter((entry) => entry.status !== "in_service")) {
    row.history = [
      ...(row.history as Row[]),
      { date: row.retired_on, event: row.status === "disposed" ? "Disposed" : "Written off", amount: null, entry: null },
    ]
  }
  return draft
}

/** Cost and accumulated depreciation per ledger account, for the in-service register. */
export function registerBalances(): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const asset of buildAssets().filter((row) => row.status === "in_service")) {
    const category = FIN_ASSET_CATEGORY_ROWS.find((row) => row.id === asset.category_id) as AssetCategory
    balances[category.cost_account] = r2((balances[category.cost_account] ?? 0) + Number(asset.cost))
    balances[category.accum_account] = r2((balances[category.accum_account] ?? 0) - Number(asset.accumulated))
  }
  return balances
}

/**
 * The monthly charge per accumulated-depreciation account for the seeded
 * months (January and February), taken from the register's own charges.
 */
export function seededMonthlyDepreciation(): Record<string, number> {
  const byAccount: Record<string, number> = {}
  for (const asset of buildAssets().filter((row) => row.status === "in_service")) {
    const category = FIN_ASSET_CATEGORY_ROWS.find((row) => row.id === asset.category_id) as AssetCategory
    const charge = monthlyCharge(String(asset.method), Number(asset.life), Number(asset.cost), Number(asset.salvage), Number(asset.accumulated))
    byAccount[category.accum_account] = r2((byAccount[category.accum_account] ?? 0) + charge)
  }
  return byAccount
}
