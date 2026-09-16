"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { departmentsApi } from "../api/departments"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateDeptPayload, UpdateDeptPayload } from "../types"

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDeptPayload) =>
      departmentsApi.create(payload).then((r) => r.data.data),
    onSuccess: (_, { branch_id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.departments.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.branches.departments(branch_id),
      })
    },
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateDeptPayload
    }) => departmentsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.departments.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.departments.all })
    },
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.departments.all }),
  })
}
