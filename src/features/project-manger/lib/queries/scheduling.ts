"use client"

import { useQuery } from "@tanstack/react-query"
import { schedulingApi } from "../api/scheduling"
import { pmKeys } from "../constants/query-keys"
import type { PortfolioScheduleParams } from "../types"

/** Milestones across every active project (portfolio view). */
export function usePortfolioSchedule(params?: PortfolioScheduleParams) {
  return useQuery({
    queryKey: pmKeys.scheduling.portfolio(params),
    queryFn: () =>
      schedulingApi.portfolioSchedule(params).then((r) => r.data.data),
  })
}

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: pmKeys.scheduling.milestones(projectId),
    queryFn: () =>
      schedulingApi.listMilestones(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useBaselines(projectId: string) {
  return useQuery({
    queryKey: pmKeys.scheduling.baselines(projectId),
    queryFn: () =>
      schedulingApi.listBaselines(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useCriticalPath(projectId: string) {
  return useQuery({
    queryKey: pmKeys.scheduling.criticalPath(projectId),
    queryFn: () =>
      schedulingApi.criticalPath(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useTaskDependencies(taskId: string) {
  return useQuery({
    queryKey: pmKeys.scheduling.dependencies(taskId),
    queryFn: () =>
      schedulingApi.listDependencies(taskId).then((r) => r.data.data),
    enabled: !!taskId,
  })
}
