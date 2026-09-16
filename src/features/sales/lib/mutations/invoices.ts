"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invoicesApi } from "../api/invoices"
import { salesKeys } from "../constants/query-keys"
import { resolveExportDownloadUrl } from "../utils/export-job"
import type {
  CancelInvoicePayload,
  InvoiceExportFilters,
  InvoicePdfParams,
  InvoicePrintUrlParams,
  MarkInvoiceSentPayload,
} from "../types"
import type { SalesExportRequest } from "../types/common"

function invalidateInvoice(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: salesKeys.invoices.detail(id) })
  qc.invalidateQueries({ queryKey: salesKeys.invoices.all })
}

export function usePostInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.post(id).then((r) => r.data.data),
    onSuccess: (_, id) => invalidateInvoice(qc, id),
  })
}

export function useMarkInvoiceSent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkInvoiceSentPayload }) =>
      invoicesApi.markSent(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateInvoice(qc, id),
  })
}

export function useCloseInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.close(id).then((r) => r.data.data),
    onSuccess: (_, id) => invalidateInvoice(qc, id),
  })
}

export function useCancelInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelInvoicePayload }) =>
      invoicesApi.cancel(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      invalidateInvoice(qc, id)
      qc.invalidateQueries({ queryKey: salesKeys.orders.all })
    },
  })
}

export function useInvoicePdf() {
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: InvoicePdfParams }) =>
      invoicesApi.getPdf(id, params).then((r) => r.data.data.download_url),
  })
}

export function useInvoicePrintUrl() {
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: InvoicePrintUrlParams }) =>
      invoicesApi.getPrintUrl(id, params).then((r) => r.data.data.print_url),
  })
}

export function useExportInvoices() {
  return useMutation({
    mutationFn: async (payload: SalesExportRequest<InvoiceExportFilters>) => {
      const result = await invoicesApi.export(payload).then((r) => r.data.data)
      return resolveExportDownloadUrl(result)
    },
  })
}
