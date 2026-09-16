"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "../api/tasks"
import { operationsKeys } from "../constants/query-keys"
import type { CreateTaskPayload, UpdateTaskPayload } from "../types"

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: operationsKeys.tasks.all })
      // Project KPIs' `overdue_tasks` is computed from the tasks table.
      qc.invalidateQueries({ queryKey: operationsKeys.projects.kpis() })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      tasksApi.update(id, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: operationsKeys.tasks.all })
      qc.invalidateQueries({ queryKey: operationsKeys.projects.kpis() })
    },
  })
}
