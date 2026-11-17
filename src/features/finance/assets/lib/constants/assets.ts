import type { AssetsMessageKey, DepreciationMethod } from "../types/assets"

/** `FinanceAssets` keys for each depreciation method. */
export const METHOD_LABEL_KEYS: Record<DepreciationMethod, AssetsMessageKey> = {
  straight_line: "methodStraightLine",
  declining_balance: "methodDecliningBalance",
}
