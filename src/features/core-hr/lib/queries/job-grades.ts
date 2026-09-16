"use client"

import { useQuery } from "@tanstack/react-query"
import { jobGradesApi } from "../api/job-grades"
import { coreHrKeys } from "../constants/query-keys"
import type { JobGradeListParams, ValidateBandPayload } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useJobGrades(params?: JobGradeListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.jobGrades.list(params),
    queryFn: () => jobGradesApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useJobGrade(id: string) {
  return useQuery({
    queryKey: coreHrKeys.jobGrades.detail(id),
    queryFn: () => jobGradesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useValidateBand(payload: ValidateBandPayload | null) {
  return useQuery({
    queryKey: [...coreHrKeys.jobGrades.all, "validate-band", payload],
    queryFn: () =>
      jobGradesApi.validateBand(payload!).then((r) => r.data.data),
    enabled: !!payload?.job_grade_id && !!payload?.basic_salary,
  })
}
