"use client"

import { useQuery } from "@tanstack/react-query"

import { cashflowApi } from "../api/cashflow"
import { financeKeys } from "../constants/query-keys"
import type { FinanceCashflowRange } from "../types"

export function useFinanceCashflowTimeline(range?: FinanceCashflowRange) {
  return useQuery({
    queryKey: financeKeys.cashflow.timeline(range),
    queryFn: () => cashflowApi.timeline(range).then((r) => r.data.data),
  })
}

export function useFinanceCashflowRunway() {
  return useQuery({
    queryKey: financeKeys.cashflow.runway(),
    queryFn: () => cashflowApi.runway().then((r) => r.data.data),
  })
}
