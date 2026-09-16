"use client"

import { useQuery } from "@tanstack/react-query"
import { jobsApi } from "../api/jobs"
import { coreHrKeys } from "../constants/query-keys"
import type { JobListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useJobs(params?: JobListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.jobs.list(params),
    queryFn: () => jobsApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: coreHrKeys.jobs.detail(id),
    queryFn: () => jobsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useJobFamilies() {
  return useQuery({
    queryKey: coreHrKeys.jobs.families(),
    queryFn: () => jobsApi.getFamilies().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}
