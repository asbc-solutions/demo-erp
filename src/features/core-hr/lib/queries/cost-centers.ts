"use client"

import { useQuery } from "@tanstack/react-query"
import { costCentersApi } from "../api/cost-centers"
import { coreHrKeys } from "../constants/query-keys"
import type { CostCenterListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useCostCenters(params: CostCenterListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.costCenters.list(params),
    queryFn: () => costCentersApi.list(params).then((r) => r.data),
    ...options,
    enabled: !!params.fiscal_year && (options?.enabled ?? true),
  })
}

export function useCostCenter(id: string) {
  return useQuery({
    queryKey: coreHrKeys.costCenters.detail(id),
    queryFn: () => costCentersApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCostCenterSalarySummary(id: string) {
  return useQuery({
    queryKey: coreHrKeys.costCenters.salarySummary(id),
    queryFn: () =>
      costCentersApi.getSalarySummary(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCostCenterHierarchy(id: string) {
  return useQuery({
    queryKey: coreHrKeys.costCenters.hierarchy(id),
    queryFn: () => costCentersApi.getHierarchy(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
