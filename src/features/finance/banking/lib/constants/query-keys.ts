import { financeKeys } from "../../../lib/constants/query-keys"
import type { ChequeDirection } from "../types/banking"

export const bankingKeys = {
  all: [...financeKeys.all, "banking"] as const,
  overview: () => [...bankingKeys.all, "overview"] as const,
  treasury: (id: string) => [...bankingKeys.all, "treasury", id] as const,
  workspace: (treasuryId: string) => [...bankingKeys.all, "reconciliation", treasuryId] as const,
  latestImport: (treasuryId: string) => [...bankingKeys.all, "import", treasuryId] as const,
  transfers: () => [...bankingKeys.all, "transfers"] as const,
  cheques: (direction: ChequeDirection) => [...bankingKeys.all, "cheques", direction] as const,
  cheque: (id: string) => [...bankingKeys.all, "cheque", id] as const,
  chequeBooks: () => [...bankingKeys.all, "cheque-books"] as const,
  employees: () => [...bankingKeys.all, "employees"] as const,
  custody: () => [...bankingKeys.all, "custody"] as const,
  custodyHolder: (id: string) => [...bankingKeys.all, "custody", id] as const,
} as const
