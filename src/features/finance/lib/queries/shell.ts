"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { QueryHookOptions } from "@/src/shared/lib/types/query"

import { financeShellApi } from "../api/shell"
import { financeKeys } from "../constants/query-keys"

/** Master data behind the scope pickers changes rarely. */
const MASTER_DATA_STALE_TIME_MS = 10 * 60 * 1000

export function useFinanceEntities() {
  return useQuery({
    queryKey: financeKeys.shell.entities(),
    queryFn: () => financeShellApi.entities().then((r) => r.data.data),
    staleTime: MASTER_DATA_STALE_TIME_MS,
  })
}

export function useFinancePeriods() {
  return useQuery({
    queryKey: financeKeys.shell.periods(),
    queryFn: () => financeShellApi.periods().then((r) => r.data.data),
    staleTime: MASTER_DATA_STALE_TIME_MS,
  })
}

/** Badge counts for the finance nav; the sidebar only enables it while visible. */
export function useFinanceNavCounts(options?: QueryHookOptions) {
  return useQuery({
    queryKey: financeKeys.shell.navCounts(),
    queryFn: () => financeShellApi.navCounts().then((r) => r.data.data),
    ...options,
  })
}

export function useFinanceSearch(q: string) {
  const term = q.trim()
  return useQuery({
    queryKey: financeKeys.shell.search(term),
    queryFn: () => financeShellApi.search(term).then((r) => r.data.data),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
  })
}
