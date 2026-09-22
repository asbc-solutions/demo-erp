import { collection, findRow, type Row } from "../../demo-db"
import { monthlyCharge } from "../../seed/finance/assets"
import { FIN_CLOSING_PERIOD } from "../../seed/finance/calendar"
import { FIN_COLLECTIONS } from "./collections"

/**
 * The fixed-asset register as the screens read it, and the period's
 * depreciation run. Kept apart from the routes so the close checklist can
 * ask whether depreciation has posted.
 */

const r2 = (value: number) => Math.round(value * 100) / 100

export function assetCategory(id: unknown): Row | undefined {
  return findRow(FIN_COLLECTIONS.assetCategories, String(id))
}

export function assets(): Row[] {
  return collection(FIN_COLLECTIONS.assets)
}

/** This month's charge; nothing once retired or fully depreciated. */
export function assetCharge(asset: Row): number {
  if (asset.status !== "in_service") return 0
  return monthlyCharge(String(asset.method), Number(asset.life), Number(asset.cost), Number(asset.salvage), Number(asset.accumulated))
}

export function presentAsset(asset: Row): Row {
  const cost = Number(asset.cost)
  const accumulated = Number(asset.accumulated)
  return {
    ...asset,
    category_name: assetCategory(asset.category_id)?.name ?? "",
    cost_center_name: findRow(FIN_COLLECTIONS.costCenters, String(asset.cost_center_id))?.name ?? null,
    // A retired asset keeps the carrying amount it was derecognised at; totals count only assets in service.
    nbv: r2(cost - accumulated),
    pct_depreciated: cost ? Math.round((accumulated / cost) * 100) : 0,
    monthly_charge: assetCharge(asset),
  }
}

export function depreciationRun(period = FIN_CLOSING_PERIOD): Row | undefined {
  return findRow(FIN_COLLECTIONS.depreciationRuns, `DR-${period}`)
}

/** What the run would charge now: in-service assets with something left to depreciate, less the ones set aside. */
function draftLines(record: Row) {
  const setAside = new Set((record.skipped as string[]) ?? [])
  const lines: Row[] = []
  const held: Row[] = []
  let skipped = 0
  for (const asset of assets()) {
    const amount = assetCharge(asset)
    const started = String(asset.in_service).slice(0, 7) <= String(record.period)
    const line = {
      id: asset.id,
      number: asset.number,
      name: asset.name,
      category_id: asset.category_id,
      nbv: r2(Number(asset.cost) - Number(asset.accumulated)),
      charge: amount,
    }
    if (amount <= 0 || !started) {
      skipped++
      continue
    }
    if (setAside.has(String(asset.id))) {
      skipped++
      held.push(line)
      continue
    }
    lines.push(line)
  }
  return { lines, skipped, held }
}

export function runSummary(record: Row) {
  const posted = record.status === "posted"
  const draft = posted ? null : draftLines(record)
  const items = draft ? draft.lines : ((record.lines as Row[]) ?? [])
  const byCategory = new Map<string, number>()
  for (const line of items) byCategory.set(String(line.category_id), r2((byCategory.get(String(line.category_id)) ?? 0) + Number(line.charge)))
  return {
    id: String(record.id),
    period: String(record.period),
    status: String(record.status),
    entry: (record.entry as string | null) ?? null,
    items,
    count: items.length,
    skipped: draft ? draft.skipped : Number(record.skipped_count ?? 0),
    /** Assets the user took out of this run; they can be put back until it posts. */
    set_aside: draft ? draft.held : [],
    total: r2(items.reduce((sum, line) => sum + Number(line.charge), 0)),
    by_category: [...byCategory]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, amount]) => {
        const meta = assetCategory(id)
        return { id, name: String(meta?.name ?? id), account: String(meta?.accum_account ?? ""), amount }
      }),
  }
}

/** 1 while the closing period's run is still a draft, for the close checklist. */
export function depreciationOutstanding(period = FIN_CLOSING_PERIOD): number {
  return depreciationRun(period)?.status === "posted" ? 0 : 1
}
