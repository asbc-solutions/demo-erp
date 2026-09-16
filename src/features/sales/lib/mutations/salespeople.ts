"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { salespeopleApi } from "../api/salespeople"
import { salesKeys } from "../constants/query-keys"
import type { CreateSalespersonPayload, UpdateSalespersonPayload } from "../types"

export function useCreateSalesperson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSalespersonPayload) =>
      salespeopleApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.salespeople.all }),
  })
}

export function useUpdateSalesperson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalespersonPayload }) =>
      salespeopleApi.update(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.salespeople.all }),
  })
}
