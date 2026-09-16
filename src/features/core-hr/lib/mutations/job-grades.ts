"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { jobGradesApi } from "../api/job-grades"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateJobGradePayload, UpdateJobGradePayload } from "../types"

export function useCreateJobGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateJobGradePayload) =>
      jobGradesApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.jobGrades.all }),
  })
}

export function useUpdateJobGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateJobGradePayload
    }) => jobGradesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.jobGrades.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.jobGrades.all })
    },
  })
}

export function useDeleteJobGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobGradesApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.jobGrades.all }),
  })
}
