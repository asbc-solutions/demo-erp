"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { timeExpenseApi } from "../api/time-expense"
import { pmKeys } from "../constants/query-keys"
import type {
  CreateExpensePayload,
  LogTimePayload,
  SubmitTimesheetPayload,
} from "../types"

export function useLogTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LogTimePayload) =>
      timeExpenseApi.logTime(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.timeExpense.all })
      qc.invalidateQueries({ queryKey: pmKeys.myWork.all })
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      timeExpenseApi.createExpense(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.timeExpense.all }),
  })
}

export function useSubmitExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: string) =>
      timeExpenseApi.submitExpense(expenseId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.timeExpense.all }),
  })
}

export function useSubmitTimesheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitTimesheetPayload) =>
      timeExpenseApi.submitTimesheet(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.timeExpense.all }),
  })
}
