"use client"

import { useQuery } from "@tanstack/react-query"
import { resourcesApi } from "../api/resources"
import { pmKeys } from "../constants/query-keys"
import type { ResourceListParams, ResourcePeriodParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

/** Portfolio (or per-project) resource summary cards. */
export function useResourcePlannerSummary(params?: ResourcePeriodParams) {
  return useQuery({
    queryKey: pmKeys.resources.summary(params),
    queryFn: () => resourcesApi.summary(params).then((r) => r.data.data),
  })
}

/** Weekly allocation heatmap over a period (portfolio-wide by default). */
export function useResourceHeatmap(params: ResourcePeriodParams) {
  return useQuery({
    queryKey: pmKeys.resources.heatmap(params),
    queryFn: () => resourcesApi.heatmap(params).then((r) => r.data.data),
    enabled: !!params.from && !!params.to,
  })
}

/** Resources assigned to a single project (project-scoped utilization). */
export function useProjectUtilization(projectId: string) {
  return useQuery({
    queryKey: pmKeys.resources.utilization(projectId),
    queryFn: () =>
      resourcesApi.projectUtilization(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

/** Global resource pool (HR employees + PM profile). */
export function useResources(params?: ResourceListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: pmKeys.resources.list(params),
    queryFn: () => resourcesApi.list(params).then((r) => r.data.data),
    ...options,
  })
}

export function useResourceCapacity(employeeId: string, from: string, to: string) {
  return useQuery({
    queryKey: pmKeys.resources.capacity(employeeId, from, to),
    queryFn: () =>
      resourcesApi.capacity(employeeId, from, to).then((r) => r.data.data),
    enabled: !!employeeId && !!from && !!to,
  })
}

export function useResourceProfile(employeeId: string) {
  return useQuery({
    queryKey: pmKeys.resources.profile(employeeId),
    queryFn: () =>
      resourcesApi.getProfile(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}
