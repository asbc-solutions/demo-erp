"use client"

import { useQuery } from "@tanstack/react-query"

import { complianceOverviewApi } from "../api/overview"
import { complianceKeys } from "../constants/query-keys"
import type { CriticalAlertsParams } from "../types/overview"

export function useComplianceScore() {
  return useQuery({
    queryKey: complianceKeys.overview.score(),
    queryFn: () => complianceOverviewApi.getScore().then((r) => r.data.data),
  })
}

export function useCriticalAlerts(params?: CriticalAlertsParams) {
  return useQuery({
    queryKey: complianceKeys.overview.alerts(params),
    queryFn: () => complianceOverviewApi.listAlerts(params).then((r) => r.data.data),
  })
}
