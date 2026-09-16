"use client"

import { useQuery } from "@tanstack/react-query"
import { salariesApi } from "../api/salaries"
import { coreHrKeys } from "../constants/query-keys"

export function useSalaryAnalytics() {
  return useQuery({
    queryKey: coreHrKeys.salaries.analytics(),
    queryFn: () => salariesApi.analytics().then((r) => r.data.data),
  })
}

export function useSalaryHistory(employeeId: string) {
  return useQuery({
    queryKey: coreHrKeys.salaries.history(employeeId),
    queryFn: () => salariesApi.history(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}

export function useCurrentSalary(employeeId: string) {
  return useQuery({
    queryKey: coreHrKeys.salaries.current(employeeId),
    queryFn: () => salariesApi.current(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}
