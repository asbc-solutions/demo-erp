"use client"

import { useQuery } from "@tanstack/react-query"

import { payablesApi } from "../api/payables"
import { moneyOutKeys } from "../constants/query-keys"

export function useBillApprovals() {
  return useQuery({
    queryKey: moneyOutKeys.approvals(),
    queryFn: () => payablesApi.approvals().then((r) => r.data.data),
  })
}

export function usePaymentRunCandidates() {
  return useQuery({
    queryKey: moneyOutKeys.paymentRunCandidates(),
    queryFn: () => payablesApi.paymentRunCandidates().then((r) => r.data.data),
  })
}

export function useExpenses() {
  return useQuery({
    queryKey: moneyOutKeys.expenses(),
    queryFn: () => payablesApi.expenses().then((r) => r.data.data),
  })
}
