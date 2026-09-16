"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "../api/dashboard"
import { salesKeys } from "../constants/query-keys"

/** Backend caches this 5 min server-side, auto-busted on order confirm / invoice post-cancel / payment record. */
export function useSalesDashboard() {
  return useQuery({
    queryKey: salesKeys.dashboard.all,
    queryFn: () => dashboardApi.get().then((r) => r.data.data),
  })
}
