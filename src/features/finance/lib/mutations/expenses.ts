"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { expensesApi } from "../api/expenses"
import { financeKeys } from "../constants/query-keys"
import type { CreateFinanceExpensePayload } from "../types"

export function useCreateFinanceExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinanceExpensePayload) =>
      expensesApi.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      // A new expense shifts the list, the KPI summary, and the category breakdown.
      qc.invalidateQueries({ queryKey: financeKeys.expenses.all })
    },
  })
}
