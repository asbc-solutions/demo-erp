"use client"

import { useQuery } from "@tanstack/react-query"
import { departmentsApi } from "../api/departments"
import { coreHrKeys } from "../constants/query-keys"
import type { DeptListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useDepartments(params?: DeptListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.departments.list(params),
    queryFn: () => departmentsApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: coreHrKeys.departments.detail(id),
    queryFn: () => departmentsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useDepartmentPositions(id: string) {
  return useQuery({
    queryKey: coreHrKeys.departments.positions(id),
    queryFn: () => departmentsApi.getPositions(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useDepartmentTree(id: string) {
  return useQuery({
    queryKey: coreHrKeys.departments.tree(id),
    queryFn: () => departmentsApi.getTree(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
