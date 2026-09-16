"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { documentsApi } from "../api/documents"
import { pmKeys } from "../constants/query-keys"
import type {
  CheckInDocumentInput,
  RejectDocumentPayload,
  UploadDocumentInput,
} from "../types"

/** All document mutations invalidate the node's document list. */
export function useUploadDocument(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UploadDocumentInput) =>
      documentsApi.upload(nodeId, input).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.documents.forNode(nodeId) }),
  })
}

export function useApproveDocument(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      documentsApi.approve(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.documents.forNode(nodeId) }),
  })
}

export function useRejectDocument(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectDocumentPayload }) =>
      documentsApi.reject(id, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.documents.forNode(nodeId) }),
  })
}

export function useDeleteDocument(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      documentsApi.remove(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.documents.forNode(nodeId) }),
  })
}

export function useCheckOutDocument(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      documentsApi.checkOut(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.documents.forNode(nodeId) }),
  })
}

export function useCheckInDocument(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CheckInDocumentInput }) =>
      documentsApi.checkIn(id, input).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.documents.forNode(nodeId) }),
  })
}
