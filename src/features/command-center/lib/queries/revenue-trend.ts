"use client"

import { useQuery } from "@tanstack/react-query"

import { revenueTrendApi } from "../api/revenue-trend"
import { commandCenterKeys } from "../constants/query-keys"
import type { RevenueTrendRange } from "../types/revenue-trend"

export function useRevenueTrend(range: RevenueTrendRange) {
  return useQuery({
    queryKey: commandCenterKeys.revenueTrend.list(range),
    queryFn: () => revenueTrendApi.list(range).then((r) => r.data.data),
  })
}
