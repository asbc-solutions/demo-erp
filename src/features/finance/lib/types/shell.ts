import type { FinanceAccount, FinanceContact } from "./common"

export type FinanceNavCounts = {
  total: number
  /** Badge per finance nav item id, e.g. `fin-bank-reconciliation`. */
  counts: Record<string, number>
}

export type FinanceSearchResults = {
  contacts: FinanceContact[]
  accounts: FinanceAccount[]
}
