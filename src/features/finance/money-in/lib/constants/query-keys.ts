import { financeKeys } from "../../../lib/constants/query-keys"

export const moneyInKeys = {
  all: [...financeKeys.all, "money-in"] as const,
  overview: () => [...moneyInKeys.all, "overview"] as const,
  customer: (id: string) => [...moneyInKeys.all, "customer", id] as const,
  openInvoices: (customerId: string) => [...moneyInKeys.all, "open-invoices", customerId] as const,
  collections: () => [...moneyInKeys.all, "collections"] as const,
  creditNotes: () => [...moneyInKeys.all, "credit-notes"] as const,
  advances: () => [...moneyInKeys.all, "advances"] as const,
  receipts: () => [...moneyInKeys.all, "receipts"] as const,
} as const
