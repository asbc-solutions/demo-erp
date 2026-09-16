"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { salariesApi } from "../api/salaries"
import { coreHrKeys } from "../constants/query-keys"
import type { ChangeSalaryPayload, CreateSalaryPayload } from "../types"

export function useCreateSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: CreateSalaryPayload
    }) => salariesApi.create(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.salaries.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(employeeId) })
    },
  })
}

export function useSalaryChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: ChangeSalaryPayload
    }) => salariesApi.change(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.salaries.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(employeeId) })
    },
  })
}
