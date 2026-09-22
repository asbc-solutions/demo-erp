import { financeKeys } from "../../../lib/constants/query-keys"
import type { JournalFilters } from "../types/ledger"

export const ledgerKeys = {
  all: [...financeKeys.all, "ledger"] as const,
  accounts: () => [...ledgerKeys.all, "accounts"] as const,
  generalLedger: (account: string, contact: string) => [...ledgerKeys.all, "gl", account, contact] as const,
  journals: (filters: JournalFilters) => [...ledgerKeys.all, "journals", filters] as const,
  journal: (id: string) => [...ledgerKeys.all, "journal", id] as const,
  templates: () => [...ledgerKeys.all, "templates"] as const,
  recurring: () => [...ledgerKeys.all, "recurring"] as const,
  openings: () => [...ledgerKeys.all, "openings"] as const,
  currencies: () => [...ledgerKeys.all, "currencies"] as const,
  fxRevaluation: () => [...ledgerKeys.all, "fx-revaluation"] as const,
} as const
