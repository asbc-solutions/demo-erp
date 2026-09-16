"use client"

import { useQuery } from "@tanstack/react-query"
import { invoicesApi } from "../api/invoices"
import { salesKeys } from "../constants/query-keys"
import type { InvoiceListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useInvoices(params?: InvoiceListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: salesKeys.invoices.list(params),
    queryFn: () => invoicesApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: salesKeys.invoices.detail(id),
    queryFn: () => invoicesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
