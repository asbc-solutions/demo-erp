"use client"

import { useQuery } from "@tanstack/react-query"
import type { ApiError, PaginationMeta } from "@/src/shared/lib/types/api"

import {
  appraisalsApi,
  goalsApi,
  kpisApi,
  reviewCyclesApi,
} from "../api/performance"
import { coreHrKeys } from "../constants/query-keys"
import type {
  Appraisal,
  Goal,
  KpiListParams,
  MyAppraisalsParams,
  MyGoalsParams,
  ReviewCycleListParams,
  TeamAppraisalsParams,
} from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

function isNotFoundError(error: unknown) {
  const code = (error as Partial<ApiError>)?.code
  return code === "NOT_FOUND" || code === "404"
}

function emptyPage<T>(params?: { page?: number; per_page?: number }) {
  return {
    success: true,
    data: [] as T[],
    meta: {
      current_page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
      total: 0,
      last_page: 1,
    } satisfies PaginationMeta,
  }
}

// ─── KPI Library ──────────────────────────────────────────────────────────────

export function useKpis(params?: KpiListParams) {
  return useQuery({
    queryKey: coreHrKeys.performanceKpis.list(params),
    queryFn: () => kpisApi.list(params).then((r) => r.data),
  })
}

// ─── Goals & OKRs ─────────────────────────────────────────────────────────────

export function useMyGoals(params?: MyGoalsParams) {
  return useQuery({
    queryKey: coreHrKeys.performanceGoals.mine(params),
    queryFn: async () => {
      try {
        const response = await goalsApi.mine(params)
        return response.data
      } catch (error) {
        if (isNotFoundError(error)) return emptyPage<Goal>(params)
        throw error
      }
    },
    retry: (failureCount, error) =>
      !isNotFoundError(error) && failureCount < 3,
  })
}

// ─── Appraisals ───────────────────────────────────────────────────────────────

export function useMyAppraisals(params?: MyAppraisalsParams) {
  return useQuery({
    queryKey: coreHrKeys.performanceAppraisals.mine(params),
    queryFn: async () => {
      try {
        const response = await appraisalsApi.mine(params)
        return response.data
      } catch (error) {
        if (isNotFoundError(error)) return emptyPage<Appraisal>(params)
        throw error
      }
    },
    retry: (failureCount, error) =>
      !isNotFoundError(error) && failureCount < 3,
  })
}

export function useTeamAppraisals(
  cycleId: string | undefined,
  params?: TeamAppraisalsParams,
) {
  return useQuery({
    queryKey: coreHrKeys.performanceAppraisals.byCycle(cycleId ?? "", params),
    queryFn: async () => {
      try {
        const response = await appraisalsApi.byCycle(cycleId!, params)
        return response.data
      } catch (error) {
        if (isNotFoundError(error)) return emptyPage<Appraisal>(params)
        throw error
      }
    },
    enabled: !!cycleId,
    retry: (failureCount, error) =>
      !isNotFoundError(error) && failureCount < 3,
  })
}

export function useReviewCycles(params?: ReviewCycleListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.performanceCycles.list(params),
    queryFn: () => reviewCyclesApi.list(params).then((r) => r.data),
    ...options,
  })
}
