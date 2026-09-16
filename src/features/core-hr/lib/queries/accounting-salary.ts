"use client"

import { useQuery } from "@tanstack/react-query"
import { accountingSalaryApi } from "../api/accounting-salary"
import { coreHrKeys } from "../constants/query-keys"
import type { AccountingSalaryListParams } from "../types"

export function useAccountingSalaries(params?: AccountingSalaryListParams) {
  return useQuery({
    queryKey: coreHrKeys.accountingSalary.list(params),
    queryFn: () => accountingSalaryApi.list(params).then((r) => r.data),
  })
}

export function useAccountingSalary(id: string) {
  return useQuery({
    queryKey: coreHrKeys.accountingSalary.detail(id),
    queryFn: () => accountingSalaryApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
