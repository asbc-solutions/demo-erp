"use client"

import { useQuery } from "@tanstack/react-query"

import { subledgerApi } from "../api/subledger"
import { subledgerKeys } from "../constants/query-keys"
import type { Side } from "../types/subledger"

export function useSubledgerOverview(side: Side) {
  return useQuery({
    queryKey: subledgerKeys.overview(side),
    queryFn: () => subledgerApi.overview(side).then((r) => r.data.data),
  })
}

export function useContactCard(side: Side, id: string) {
  return useQuery({
    queryKey: subledgerKeys.contact(side, id),
    queryFn: () => subledgerApi.contact(side, id).then((r) => r.data.data),
  })
}

export function useSubledgerNotes(side: Side, enabled = true) {
  return useQuery({
    queryKey: subledgerKeys.notes(side),
    queryFn: () => subledgerApi.notes(side).then((r) => r.data.data),
    enabled,
  })
}

export function useSubledgerAdvances(side: Side, enabled = true) {
  return useQuery({
    queryKey: subledgerKeys.advances(side),
    queryFn: () => subledgerApi.advances(side).then((r) => r.data.data),
    enabled,
  })
}

export function useVouchers(side: Side) {
  return useQuery({
    queryKey: subledgerKeys.vouchers(side),
    queryFn: () => subledgerApi.vouchers(side).then((r) => r.data.data),
  })
}
