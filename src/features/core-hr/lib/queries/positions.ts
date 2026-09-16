"use client"

import { useQuery } from "@tanstack/react-query"
import { positionsApi } from "../api/positions"
import { coreHrKeys } from "../constants/query-keys"
import type { PositionListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function usePositions(params?: PositionListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.positions.list(params),
    queryFn: () => positionsApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: coreHrKeys.positions.detail(id),
    queryFn: () => positionsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
