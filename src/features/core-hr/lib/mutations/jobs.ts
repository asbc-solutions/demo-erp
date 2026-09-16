"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi } from "../api/jobs"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateJobPayload, UpdateJobPayload } from "../types"

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateJobPayload) =>
      jobsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.jobs.all }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateJobPayload
    }) => jobsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.jobs.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.jobs.all })
    },
  })
}

export function useCloneJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobsApi.clone(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.jobs.all }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.jobs.all }),
  })
}
