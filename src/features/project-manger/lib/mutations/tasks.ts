"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "../api/tasks"
import { pmKeys } from "../constants/query-keys"
import type {
  UpdateTaskStatusPayload,
  AddTaskAssigneePayload,
  LogTimePayload,
} from "../types"

/**
 * Persist a task's status / percent. Pass `projectId` so the project hierarchy
 * (which feeds the Tasks Kanban and WBS) is refetched on success.
 */
export function useUpdateTaskStatus(projectId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string
      payload: UpdateTaskStatusPayload
    }) => tasksApi.updateStatus(taskId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.tasks.all })
      if (projectId)
        qc.invalidateQueries({ queryKey: pmKeys.hierarchy.byProject(projectId) })
    },
  })
}

export function useAddTaskAssignee(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddTaskAssigneePayload) =>
      tasksApi.addAssignee(taskId, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.tasks.assignees(taskId) }),
  })
}

export function useRemoveTaskAssignee(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assigneeId: string) =>
      tasksApi.removeAssignee(taskId, assigneeId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.tasks.assignees(taskId) }),
  })
}

export function useLogTime(taskId: string) {
  return useMutation({
    mutationFn: (payload: LogTimePayload) =>
      tasksApi.logTime(taskId, payload).then((r) => r.data.data),
  })
}
