export const FINANCE_REPORT_TYPES = [
  "revenue-summary",
  "receivables",
  "tax-summary",
  "expense-breakdown",
  "cashflow-projection",
  "invoice-aging",
] as const

export type FinanceReportType = (typeof FINANCE_REPORT_TYPES)[number]
