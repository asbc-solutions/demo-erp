"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { accountingSalaryApi } from "../api/accounting-salary"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateAccountingSalaryPayload } from "../types"

export function useCreateAccountingSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAccountingSalaryPayload) =>
      accountingSalaryApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.accountingSalary.all }),
  })
}

export function usePostToGL() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      accountingSalaryApi.postToGL(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({
        queryKey: coreHrKeys.accountingSalary.detail(id),
      })
      qc.invalidateQueries({ queryKey: coreHrKeys.accountingSalary.all })
    },
  })
}

export function useReverseAccountingSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      accountingSalaryApi.reverse(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({
        queryKey: coreHrKeys.accountingSalary.detail(id),
      })
      qc.invalidateQueries({ queryKey: coreHrKeys.accountingSalary.all })
    },
  })
}
