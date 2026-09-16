"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { schedulingApi } from "../api/scheduling"
import { pmKeys } from "../constants/query-keys"
import type {
  CreateMilestonePayload,
  UpdateMilestonePayload,
  CreateBaselinePayload,
} from "../types"

export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMilestonePayload) =>
      schedulingApi
        .createMilestone(projectId, payload)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.scheduling.milestones(projectId),
      }),
  })
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateMilestonePayload
    }) => schedulingApi.updateMilestone(id, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.scheduling.milestones(projectId),
      }),
  })
}

export function useCreateBaseline(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBaselinePayload) =>
      schedulingApi
        .createBaseline(projectId, payload)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.scheduling.baselines(projectId),
      }),
  })
}
