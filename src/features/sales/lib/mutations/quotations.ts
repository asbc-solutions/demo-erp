"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { quotationsApi } from "../api/quotations"
import { salesKeys } from "../constants/query-keys"
import { resolveExportDownloadUrl } from "../utils/export-job"
import type {
  AcceptQuotationPayload,
  CreateQuotationPayload,
  QuotationExportFilters,
  QuotationLineInput,
  QuotationPdfParams,
  RejectQuotationPayload,
  SendQuotationPayload,
  UpdateQuotationPayload,
} from "../types"
import type { SalesExportRequest } from "../types/common"

function invalidateQuotation(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: salesKeys.quotations.detail(id) })
  qc.invalidateQueries({ queryKey: salesKeys.quotations.all })
}

export function useCreateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateQuotationPayload) =>
      quotationsApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.quotations.all }),
  })
}

export function useUpdateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuotationPayload }) =>
      quotationsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useAddQuotationLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuotationLineInput }) =>
      quotationsApi.addLine(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useUpdateQuotationLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      lineId,
      payload,
    }: {
      id: string
      lineId: string
      payload: Partial<QuotationLineInput>
    }) => quotationsApi.updateLine(id, lineId, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useRemoveQuotationLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, lineId }: { id: string; lineId: string }) =>
      quotationsApi.removeLine(id, lineId).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useSendQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SendQuotationPayload }) =>
      quotationsApi.send(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useAcceptQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AcceptQuotationPayload }) =>
      quotationsApi.accept(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useRejectQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectQuotationPayload }) =>
      quotationsApi.reject(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateQuotation(qc, id),
  })
}

export function useConvertQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => quotationsApi.convert(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      invalidateQuotation(qc, id)
      qc.invalidateQueries({ queryKey: salesKeys.orders.all })
    },
  })
}

export function useDuplicateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => quotationsApi.duplicate(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.quotations.all }),
  })
}

export function useDeleteQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => quotationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.quotations.all }),
  })
}

export function useExportQuotations() {
  return useMutation({
    mutationFn: async (payload: SalesExportRequest<QuotationExportFilters>) => {
      const result = await quotationsApi.export(payload).then((r) => r.data.data)
      return resolveExportDownloadUrl(result)
    },
  })
}

export function useQuotationPdf() {
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: QuotationPdfParams }) =>
      quotationsApi.getPdf(id, params).then((r) => r.data.data.download_url),
  })
}
