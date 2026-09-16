"use client"

import { useQuery } from "@tanstack/react-query"
import { tasksApi } from "../api/tasks"
import { operationsKeys } from "../constants/query-keys"
import type { TaskListParams } from "../types"

export function useTasks(params?: TaskListParams) {
  return useQuery({
    queryKey: operationsKeys.tasks.list(params),
    queryFn: () => tasksApi.list(params).then((r) => r.data),
  })
}
