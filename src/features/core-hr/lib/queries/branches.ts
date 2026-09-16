"use client"

import { useQuery } from "@tanstack/react-query"
import { branchesApi } from "../api/branches"
import { coreHrKeys } from "../constants/query-keys"
import type { BranchListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useBranches(params?: BranchListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.branches.list(params),
    queryFn: () => branchesApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: coreHrKeys.branches.detail(id),
    queryFn: () => branchesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useBranchHeadcount(id: string) {
  return useQuery({
    queryKey: coreHrKeys.branches.headcount(id),
    queryFn: () => branchesApi.getHeadcount(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useBranchHierarchy(id: string) {
  return useQuery({
    queryKey: coreHrKeys.branches.hierarchy(id),
    queryFn: () => branchesApi.getHierarchy(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
