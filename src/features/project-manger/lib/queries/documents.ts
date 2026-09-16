"use client"

import { useQuery } from "@tanstack/react-query"
import { documentsApi } from "../api/documents"
import { pmKeys } from "../constants/query-keys"
import type { DocumentLibraryParams } from "../types"

/**
 * Project-level / portfolio-wide document library. Omit `project_id` in
 * `params` to list documents across every project.
 */
export function useDocumentLibrary(params?: DocumentLibraryParams) {
  return useQuery({
    queryKey: pmKeys.documents.library(params),
    queryFn: () => documentsApi.library(params).then((r) => r.data.data),
  })
}

export function useNodeDocuments(nodeId: string) {
  return useQuery({
    queryKey: pmKeys.documents.forNode(nodeId),
    queryFn: () => documentsApi.listForNode(nodeId).then((r) => r.data.data),
    enabled: !!nodeId,
  })
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: pmKeys.documents.versions(documentId),
    queryFn: () => documentsApi.versions(documentId).then((r) => r.data.data),
    enabled: !!documentId,
  })
}
