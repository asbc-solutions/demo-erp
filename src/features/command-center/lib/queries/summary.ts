"use client"

import { useQuery } from "@tanstack/react-query"

import { commandCenterSummaryApi } from "../api/summary"
import { commandCenterKeys } from "../constants/query-keys"

export function useCommandCenterSummary() {
  return useQuery({
    queryKey: commandCenterKeys.summary.get(),
    queryFn: () => commandCenterSummaryApi.get().then((r) => r.data.data),
  })
}
