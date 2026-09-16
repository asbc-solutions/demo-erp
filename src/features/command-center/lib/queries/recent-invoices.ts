"use client"

import { useQuery } from "@tanstack/react-query"

import { recentInvoicesApi } from "../api/recent-invoices"
import { commandCenterKeys } from "../constants/query-keys"
import type { RecentInvoicesParams } from "../types/recent-invoices"

export function useRecentInvoices(params?: RecentInvoicesParams) {
  return useQuery({
    queryKey: commandCenterKeys.recentInvoices.list(params),
    queryFn: () => recentInvoicesApi.list(params).then((r) => r.data.data),
  })
}
