import { financeKeys } from "../../../lib/constants/query-keys"

export const taxKeys = {
  all: [...financeKeys.all, "tax"] as const,
  vatReturns: () => [...taxKeys.all, "vat-returns"] as const,
  vatReturn: (id: string) => [...taxKeys.all, "vat-return", id] as const,
  withholding: () => [...taxKeys.all, "withholding"] as const,
  eInvoicing: (authority: string) => [...taxKeys.all, "e-invoicing", authority] as const,
  eDocument: (id: string) => [...taxKeys.all, "e-document", id] as const,
  declarations: () => [...taxKeys.all, "declarations"] as const,
  codes: () => [...taxKeys.all, "codes"] as const,
  auditFiles: () => [...taxKeys.all, "audit-files"] as const,
} as const
