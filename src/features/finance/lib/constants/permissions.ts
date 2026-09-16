/**
 * Resource slugs confirmed against every `bruno/Finance/**\/*.bru` docs block
 * (grep for FORBIDDEN) — there is no broader "finance.access" slug, so each
 * tab gates on its own resource.
 */
export const FINANCE_RESOURCES = {
  cashflow: "finance.cashflow",
  expenses: "finance.expenses",
  invoices: "finance.invoices",
  reports: "finance.reports",
} as const

export type FinanceResource = (typeof FINANCE_RESOURCES)[keyof typeof FINANCE_RESOURCES]
