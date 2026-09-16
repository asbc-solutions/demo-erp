"use client"

import { useQuery } from "@tanstack/react-query"
import { timeExpenseApi } from "../api/time-expense"
import { pmKeys } from "../constants/query-keys"
import type { ExpenseListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

/** Weekly timesheet grid for an employee. Both args are required. */
export function useCurrentTimesheet(employeeId: string, weekStart: string) {
  return useQuery({
    queryKey: pmKeys.timeExpense.timesheet(employeeId, weekStart),
    queryFn: () =>
      timeExpenseApi
        .currentTimesheet({ employee_id: employeeId, week_start: weekStart })
        .then((r) => r.data.data),
    enabled: !!employeeId && !!weekStart,
  })
}

export function useExpenses(params?: ExpenseListParams) {
  return useQuery({
    queryKey: pmKeys.timeExpense.expenses(params),
    queryFn: () => timeExpenseApi.listExpenses(params).then((r) => r.data.data),
    enabled: !!params?.employee_id,
  })
}

/** Fixed expense-category lookup (for dialog dropdowns). */
export function useExpenseCategories(options?: QueryHookOptions) {
  return useQuery({
    queryKey: pmKeys.timeExpense.categories(),
    queryFn: () =>
      timeExpenseApi.expenseCategories().then((r) => r.data.data),
    staleTime: Infinity,
    ...options,
  })
}
