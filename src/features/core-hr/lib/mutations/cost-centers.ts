"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { costCentersApi } from "../api/cost-centers"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateCostCenterPayload, UpdateCostCenterPayload } from "../types"

export function useCreateCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCostCenterPayload) =>
      costCentersApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.costCenters.all }),
  })
}

export function useUpdateCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateCostCenterPayload
    }) => costCentersApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.costCenters.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.costCenters.all })
    },
  })
}

export function useDeleteCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => costCentersApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.costCenters.all }),
  })
}
