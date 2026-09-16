"use client"

import { useQuery } from "@tanstack/react-query"
import { myWorkApi } from "../api/my-work"
import { pmKeys } from "../constants/query-keys"
import type { MyMilestonesParams, MyProjectsParams } from "../types"

export function useMySummary() {
  return useQuery({
    queryKey: pmKeys.myWork.summary(),
    queryFn: () => myWorkApi.summary().then((r) => r.data.data),
  })
}

export function useMyPriorities(date?: string) {
  return useQuery({
    queryKey: pmKeys.myWork.priorities(date),
    queryFn: () => myWorkApi.priorities(date).then((r) => r.data.data),
  })
}

export function useMyCapacity(weekStart?: string) {
  return useQuery({
    queryKey: pmKeys.myWork.capacity(weekStart),
    queryFn: () => myWorkApi.capacity(weekStart).then((r) => r.data.data),
  })
}

export function useMyProjects(params?: MyProjectsParams) {
  return useQuery({
    queryKey: pmKeys.myWork.projects(params),
    queryFn: () => myWorkApi.projects(params).then((r) => r.data.data),
  })
}

export function useMyActivity(limit?: number) {
  return useQuery({
    queryKey: pmKeys.myWork.activity(limit),
    queryFn: () => myWorkApi.activity(limit).then((r) => r.data.data),
  })
}

export function useMyProjectsStats() {
  return useQuery({
    queryKey: pmKeys.myWork.projectsStats(),
    queryFn: () => myWorkApi.projectsStats().then((r) => r.data.data),
  })
}

export function useMyMilestones(params?: MyMilestonesParams) {
  return useQuery({
    queryKey: pmKeys.myWork.milestones(params),
    queryFn: () => myWorkApi.milestones(params).then((r) => r.data.data),
  })
}
