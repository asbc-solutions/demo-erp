import type {
  FinanceCashflowRange,
  FinanceExpenseListParams,
  FinanceInvoiceListParams,
} from "../types"
import type { FinanceReportType } from "./report-types"

export const financeKeys = {
  invoices: {
    all: ["finance", "invoices"] as const,
    list: (params?: FinanceInvoiceListParams) =>
      [...financeKeys.invoices.all, "list", params] as const,
    detail: (id: string) => [...financeKeys.invoices.all, "detail", id] as const,
  },

  cashflow: {
    all: ["finance", "cashflow"] as const,
    timeline: (range?: FinanceCashflowRange) =>
      [...financeKeys.cashflow.all, "timeline", range] as const,
    runway: () => [...financeKeys.cashflow.all, "runway"] as const,
  },

  expenses: {
    all: ["finance", "expenses"] as const,
    list: (params?: FinanceExpenseListParams) =>
      [...financeKeys.expenses.all, "list", params] as const,
    summary: () => [...financeKeys.expenses.all, "summary"] as const,
    categories: () => [...financeKeys.expenses.all, "categories"] as const,
    breakdown: (from?: string, to?: string) =>
      [...financeKeys.expenses.all, "breakdown", from ?? null, to ?? null] as const,
  },

  reports: {
    all: ["finance", "reports"] as const,
    cards: () => [...financeKeys.reports.all, "cards"] as const,
    rows: (type: FinanceReportType) => [...financeKeys.reports.all, "rows", type] as const,
  },
} as const
