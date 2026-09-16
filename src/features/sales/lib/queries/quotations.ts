"use client"

import { useQuery } from "@tanstack/react-query"
import { quotationsApi } from "../api/quotations"
import { salesKeys } from "../constants/query-keys"
import type { QuotationListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useQuotations(params?: QuotationListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: salesKeys.quotations.list(params),
    queryFn: () => quotationsApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: salesKeys.quotations.detail(id),
    queryFn: () => quotationsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
