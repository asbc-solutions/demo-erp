"use client"

import { useQuery } from "@tanstack/react-query"

import { expensesApi } from "../api/expenses"
import { financeKeys } from "../constants/query-keys"
import type { FinanceExpenseListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useFinanceExpenses(params?: FinanceExpenseListParams) {
  return useQuery({
    queryKey: financeKeys.expenses.list(params),
    queryFn: () => expensesApi.list(params).then((r) => r.data),
  })
}

export function useFinanceExpenseSummary() {
  return useQuery({
    queryKey: financeKeys.expenses.summary(),
    queryFn: () => expensesApi.summary().then((r) => r.data.data),
  })
}

export function useFinanceExpenseCategories(options?: QueryHookOptions) {
  return useQuery({
    queryKey: financeKeys.expenses.categories(),
    queryFn: () => expensesApi.categories().then((r) => r.data.data),
    ...options,
  })
}

export function useFinanceExpenseBreakdown(from?: string, to?: string) {
  return useQuery({
    queryKey: financeKeys.expenses.breakdown(from, to),
    queryFn: () => expensesApi.breakdown(from, to).then((r) => r.data.data),
  })
}
