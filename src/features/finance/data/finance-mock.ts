// Pure UI config for the Finance module — NOT data. All data comes from
// src/features/finance/lib/{api,queries,mutations,types} against the real
// bruno/Finance/**/*.bru backend.

export const FINANCE_TABS = [
  { id: "invoices", label: "Invoices" },
  { id: "cashflow", label: "Cashflow" },
  { id: "expenses", label: "Expenses" },
  { id: "reports", label: "Reports" },
] as const

export type FinanceTabId = (typeof FINANCE_TABS)[number]["id"]

export const INVOICE_STATUS_FILTERS = [
  "All",
  "Draft",
  "Sent",
  "Overdue",
  "Paid",
] as const

export type InvoiceStatusFilter = (typeof INVOICE_STATUS_FILTERS)[number]
