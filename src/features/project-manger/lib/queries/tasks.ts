"use client"

import { useQuery } from "@tanstack/react-query"
import { peopleApi } from "../api/people"
import { tasksApi } from "../api/tasks"
import { pmKeys } from "../constants/query-keys"
import type { TaskListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useTasks(params?: TaskListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: pmKeys.tasks.list(params),
    queryFn: () => tasksApi.list(params).then((r) => r.data.data),
    ...options,
  })
}

export function useTaskAssignees(taskId: string) {
  return useQuery({
    queryKey: pmKeys.tasks.assignees(taskId),
    queryFn: () => tasksApi.listAssignees(taskId).then((r) => r.data.data),
    enabled: !!taskId,
  })
}

/** Resolve employee ids → display objects (name, initials, avatar). */
export function usePeople(ids: string[]) {
  const sorted = [...new Set(ids)].sort()
  return useQuery({
    queryKey: pmKeys.tasks.people(sorted),
    queryFn: () => peopleApi.resolve(sorted).then((r) => r.data.data),
    enabled: sorted.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEmployeeWorkload(employeeId: string) {
  return useQuery({
    queryKey: pmKeys.tasks.workload(employeeId),
    queryFn: () =>
      tasksApi.employeeWorkload(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}
