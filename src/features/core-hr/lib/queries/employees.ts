"use client"

import { useQuery } from "@tanstack/react-query"
import { employeesApi } from "../api/employees"
import { coreHrKeys } from "../constants/query-keys"
import type { EmployeeListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useEmployees(params?: EmployeeListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.employees.list(params),
    queryFn: () => employeesApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: coreHrKeys.employees.detail(id),
    queryFn: () => employeesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useEmployeeDirectReports(id: string) {
  return useQuery({
    queryKey: coreHrKeys.employees.directReports(id),
    queryFn: () => employeesApi.directReports(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useEmployeeOrgChart(id: string) {
  return useQuery({
    queryKey: coreHrKeys.employees.orgChart(id),
    queryFn: () => employeesApi.orgChart(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
