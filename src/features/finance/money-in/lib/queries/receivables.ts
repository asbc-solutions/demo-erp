"use client"

import { useQuery } from "@tanstack/react-query"

import { receivablesApi } from "../api/receivables"
import { moneyInKeys } from "../constants/query-keys"

export function useOpenInvoices(customerId: string) {
  return useQuery({
    queryKey: moneyInKeys.openInvoices(customerId),
    queryFn: () => receivablesApi.openInvoices(customerId).then((r) => r.data.data),
    enabled: Boolean(customerId),
  })
}

export function useCollections() {
  return useQuery({
    queryKey: moneyInKeys.collections(),
    queryFn: () => receivablesApi.collections().then((r) => r.data.data),
  })
}
