"use client"

import { useQuery } from "@tanstack/react-query"

import { invoicesApi } from "../api/invoices"
import { financeKeys } from "../constants/query-keys"
import type { FinanceInvoiceListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useFinanceInvoices(params?: FinanceInvoiceListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: financeKeys.invoices.list(params),
    queryFn: () => invoicesApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useFinanceInvoice(id: string | null) {
  return useQuery({
    queryKey: financeKeys.invoices.detail(id ?? ""),
    queryFn: () => invoicesApi.getById(id as string).then((r) => r.data.data),
    enabled: !!id,
  })
}
