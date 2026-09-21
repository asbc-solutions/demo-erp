import { financeKeys } from "../../../lib/constants/query-keys"

export const moneyInKeys = {
  all: [...financeKeys.all, "money-in"] as const,
  openInvoices: (customerId: string) => [...moneyInKeys.all, "open-invoices", customerId] as const,
  collections: () => [...moneyInKeys.all, "collections"] as const,
} as const
