import type { DepreciationMethod } from "../types/assets"

export const METHOD_LABELS: Record<DepreciationMethod, string> = {
  straight_line: "Straight-line",
  declining_balance: "Declining balance",
}
