"use client"

import { useQuery } from "@tanstack/react-query"
import { documentsApi } from "../api/documents"
import { coreHrKeys } from "../constants/query-keys"
import type { DocumentListParams, ExpiringDocumentsParams } from "../types"

export function useDocuments(params?: DocumentListParams) {
  return useQuery({
    queryKey: coreHrKeys.documents.list(params),
    queryFn: () => documentsApi.list(params).then((r) => r.data),
  })
}

export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: coreHrKeys.documents.byEmployee(employeeId),
    queryFn: () =>
      documentsApi.byEmployee(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}

export function useExpiringDocuments(params?: ExpiringDocumentsParams) {
  return useQuery({
    queryKey: coreHrKeys.documents.expiring(params),
    queryFn: () => documentsApi.expiring(params).then((r) => r.data),
  })
}

export function useDocumentDownloadUrl(employeeId: string, documentId: string) {
  return useQuery({
    queryKey: coreHrKeys.documents.download(employeeId, documentId),
    queryFn: () =>
      documentsApi.download(employeeId, documentId).then((r) => r.data.data),
    enabled: !!employeeId && !!documentId,
    staleTime: 10 * 60 * 1000,
  })
}
