/** GET /finance/expenses/categories — a real table, not a fixed enum. */
export type FinanceExpenseCategory = {
  id: string
  code: string
  label: string
  color: string
  expense_count: number
  is_active: boolean
}

export type FinanceExpenseListItem = {
  id: string
  description: string
  vendor: string | null
  category_id: string | null
  category_label: string
  category_color: string
  amount: number
  currency_code: string
  date: string
  recurring: boolean
  created_at: string
  updated_at: string
}

export type FinanceExpenseListParams = {
  category_id?: string
  recurring?: boolean
  search?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}

/** GET /finance/expenses/summary — the 6 KPI tiles in one call. */
export type FinanceExpenseSummary = {
  total_spent: number
  spent_this_month: number
  monthly_average: number
  recurring_count: number
  recurring_amount: number
  largest_category: string
  largest_category_amount: number
}

/**
 * GET /finance/expenses/breakdown — totals grouped by category, descending.
 * Uncategorized expenses appear with `category_id: null`, `label: "Uncategorized"`.
 */
export type FinanceExpenseBreakdownEntry = {
  category_id: string | null
  label: string
  color: string
  amount: number
  expense_count: number
}

export type CreateFinanceExpensePayload = {
  description: string
  vendor?: string
  category_id?: string
  amount: number
  date: string
  recurring?: boolean
}

export type CreateFinanceExpenseResult = {
  id: string
  description: string
  vendor: string | null
  category_id: string | null
  category_label: string
  category_color: string
  amount: number
  currency_code: string
  date: string
  recurring: boolean
}
