"use client"

import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../api/reports"
import type { FinanceReportType } from "../constants/report-types"
import { financeKeys } from "../constants/query-keys"

export function useFinanceReportCards() {
  return useQuery({
    queryKey: financeKeys.reports.cards(),
    queryFn: () => reportsApi.listCards().then((r) => r.data.data),
  })
}

export function useFinanceReportRows(type: FinanceReportType | null) {
  return useQuery({
    queryKey: financeKeys.reports.rows(type ?? "revenue-summary"),
    queryFn: () => reportsApi.getRows(type as FinanceReportType).then((r) => r.data.data),
    enabled: !!type,
  })
}
