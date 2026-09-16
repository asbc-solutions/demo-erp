"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { positionsApi } from "../api/positions"
import { coreHrKeys } from "../constants/query-keys"
import type { CreatePositionPayload, UpdatePositionPayload } from "../types"

export function useCreatePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePositionPayload) =>
      positionsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.positions.all }),
  })
}

export function useUpdatePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdatePositionPayload
    }) => positionsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.positions.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.positions.all })
    },
  })
}

export function useClosePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      positionsApi.close(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.positions.all }),
  })
}

export function useDeletePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => positionsApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.positions.all }),
  })
}
