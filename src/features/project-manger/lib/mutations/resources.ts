"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { resourcesApi } from "../api/resources"
import { pmKeys } from "../constants/query-keys"
import type {
  CreateAssignmentPayload,
  CreateResourceProfilePayload,
  UpdateResourceProfilePayload,
} from "../types"

export function useCreateAssignment(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) =>
      resourcesApi.createAssignment(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.resources.utilization(projectId),
      }),
  })
}

export function useCreateResourceProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateResourceProfilePayload) =>
      resourcesApi.createProfile(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: pmKeys.resources.all }),
  })
}

export function useUpdateResourceProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: UpdateResourceProfilePayload
    }) =>
      resourcesApi.updateProfile(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: pmKeys.resources.profile(employeeId) })
      qc.invalidateQueries({ queryKey: pmKeys.resources.list() })
    },
  })
}
