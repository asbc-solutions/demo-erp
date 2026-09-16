"use client"

import { useQuery } from "@tanstack/react-query"
import { salespeopleApi } from "../api/salespeople"
import { salesKeys } from "../constants/query-keys"
import type { SalespersonListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useSalespeople(params?: SalespersonListParams) {
  return useQuery({
    queryKey: salesKeys.salespeople.list(params),
    queryFn: () => salespeopleApi.list(params).then((r) => r.data),
  })
}

/** Used to populate "Assigned Salesperson" dropdowns across Customers/Quotations/Orders. */
export function useActiveSalespeople(options?: QueryHookOptions) {
  return useQuery({
    queryKey: salesKeys.salespeople.active(),
    queryFn: () => salespeopleApi.active().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useSalesperson(id: string) {
  return useQuery({
    queryKey: salesKeys.salespeople.detail(id),
    queryFn: () => salespeopleApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
