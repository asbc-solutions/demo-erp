"use client"

import { useQuery } from "@tanstack/react-query"
import { reportingApi } from "../api/reporting"
import { pmKeys } from "../constants/query-keys"

/** Portfolio-wide analytics dashboard (KPIs, breakdowns, trends, financials). */
export function usePortfolioDashboard() {
  return useQuery({
    queryKey: pmKeys.reporting.portfolio(),
    queryFn: () => reportingApi.portfolioDashboard().then((r) => r.data.data),
  })
}
