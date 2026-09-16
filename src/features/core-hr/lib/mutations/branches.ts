"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { branchesApi } from "../api/branches"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateBranchPayload, UpdateBranchPayload } from "../types"

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBranchPayload) =>
      branchesApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.branches.all }),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateBranchPayload
    }) => branchesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.branches.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.branches.all })
    },
  })
}

export function useDeleteBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.branches.all }),
  })
}
