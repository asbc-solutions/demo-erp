import type { DepreciationMethod } from "../types/assets"

export const METHOD_LABELS: Record<DepreciationMethod, string> = {
  straight_line: "Straight-line",
  declining_balance: "Declining balance",
}

/** Cost centers an asset can be charged to. Planning owns the full list. */
export const ASSET_COST_CENTERS = [
  { id: "CC-100", name: "Head office", location: "Cairo HQ · Head office" },
  { id: "CC-200", name: "Plant", location: "10th of Ramadan · Plant" },
  { id: "CC-300", name: "Warehouse", location: "Alexandria · Warehouse" },
  { id: "CC-400", name: "Sales", location: "Cairo HQ · Sales" },
]

export function costCenterLabel(id: string): string {
  const center = ASSET_COST_CENTERS.find((row) => row.id === id)
  return center ? `${center.id} · ${center.name}` : id
}
