"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invoicesApi } from "../api/invoices"
import { financeKeys } from "../constants/query-keys"
import type { MarkFinanceInvoicePaidPayload, SaveFinanceInvoicePayload } from "../types"

export function useCreateFinanceInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveFinanceInvoicePayload) =>
      invoicesApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  })
}

export function useUpdateDraftFinanceInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveFinanceInvoicePayload }) =>
      invoicesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.detail(id) })
      qc.invalidateQueries({ queryKey: financeKeys.invoices.all })
    },
  })
}

export function useSendFinanceInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.detail(id) })
      qc.invalidateQueries({ queryKey: financeKeys.invoices.all })
    },
  })
}

export function useMarkFinanceInvoicePaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: MarkFinanceInvoicePaidPayload
    }) => invoicesApi.markPaid(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.detail(id) })
      qc.invalidateQueries({ queryKey: financeKeys.invoices.all })
    },
  })
}

export function useCancelFinanceInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.cancel(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.detail(id) })
      qc.invalidateQueries({ queryKey: financeKeys.invoices.all })
    },
  })
}
