"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { documentsApi } from "../api/documents"
import { coreHrKeys } from "../constants/query-keys"
import type {
  CreateDocumentPayload,
  UpdateDocumentPayload,
  VerifyDocumentPayload,
} from "../types"

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: CreateDocumentPayload
    }) => documentsApi.create(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.documents.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.documents.byEmployee(employeeId),
      })
    },
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      id,
      payload,
    }: {
      employeeId: string
      id: string
      payload: UpdateDocumentPayload
    }) => documentsApi.update(employeeId, id, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.documents.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.documents.byEmployee(employeeId),
      })
    },
  })
}

export function useVerifyDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      id,
      payload = {},
    }: {
      employeeId: string
      id: string
      payload?: VerifyDocumentPayload
    }) => documentsApi.verify(employeeId, id, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.documents.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.documents.byEmployee(employeeId),
      })
    },
  })
}

export function useRejectDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      id,
      payload = {},
    }: {
      employeeId: string
      id: string
      payload?: VerifyDocumentPayload
    }) => documentsApi.reject(employeeId, id, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.documents.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.documents.byEmployee(employeeId),
      })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, id }: { employeeId: string; id: string }) =>
      documentsApi.delete(employeeId, id),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.documents.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.documents.byEmployee(employeeId),
      })
    },
  })
}
