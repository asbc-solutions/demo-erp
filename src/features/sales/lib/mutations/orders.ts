"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ordersApi } from "../api/orders"
import { salesKeys } from "../constants/query-keys"
import { resolveExportDownloadUrl } from "../utils/export-job"
import type {
  CancelOrderPayload,
  ConfirmOrderPayload,
  GenerateInvoicePayload,
  OrderExportFilters,
  OrderPdfParams,
  RequestEditOrderPayload,
  UpdateOrderLinesPayload,
} from "../types"
import type { SalesExportRequest } from "../types/common"

function invalidateOrder(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: salesKeys.orders.detail(id) })
  qc.invalidateQueries({ queryKey: salesKeys.orders.all })
}

export function useConfirmOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmOrderPayload }) =>
      ordersApi.confirm(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateOrder(qc, id),
  })
}

export function useRequestEditOrder() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RequestEditOrderPayload }) =>
      ordersApi.requestEdit(id, payload).then((r) => r.data.data),
  })
}

export function useUpdateOrderLines() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderLinesPayload }) =>
      ordersApi.updateLines(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateOrder(qc, id),
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelOrderPayload }) =>
      ordersApi.cancel(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateOrder(qc, id),
  })
}

export function useGenerateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GenerateInvoicePayload }) =>
      ordersApi.generateInvoice(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      invalidateOrder(qc, id)
      qc.invalidateQueries({ queryKey: salesKeys.invoices.all })
    },
  })
}

export function useOrderPdf() {
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: OrderPdfParams }) =>
      ordersApi.getPdf(id, params).then((r) => r.data.data.download_url),
  })
}

export function useExportOrders() {
  return useMutation({
    mutationFn: async (payload: SalesExportRequest<OrderExportFilters>) => {
      const result = await ordersApi.export(payload).then((r) => r.data.data)
      return resolveExportDownloadUrl(result)
    },
  })
}
