"use client"

import { useQuery } from "@tanstack/react-query"

import { receivablesApi } from "../api/receivables"
import { moneyInKeys } from "../constants/query-keys"

export function useArOverview() {
  return useQuery({
    queryKey: moneyInKeys.overview(),
    queryFn: () => receivablesApi.overview().then((r) => r.data.data),
  })
}

export function useCustomerCard(id: string) {
  return useQuery({
    queryKey: moneyInKeys.customer(id),
    queryFn: () => receivablesApi.customer(id).then((r) => r.data.data),
  })
}

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

export function useCreditNotes(enabled = true) {
  return useQuery({
    queryKey: moneyInKeys.creditNotes(),
    queryFn: () => receivablesApi.creditNotes().then((r) => r.data.data),
    enabled,
  })
}

export function useCustomerAdvances(enabled = true) {
  return useQuery({
    queryKey: moneyInKeys.advances(),
    queryFn: () => receivablesApi.advances().then((r) => r.data.data),
    enabled,
  })
}

export function useReceipts() {
  return useQuery({
    queryKey: moneyInKeys.receipts(),
    queryFn: () => receivablesApi.receipts().then((r) => r.data.data),
  })
}
