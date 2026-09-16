import type { AxiosRequestConfig } from "axios"

import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CheckInDocumentInput,
  DocumentLibrary,
  DocumentLibraryParams,
  DocumentVersion,
  DownloadUrlResponse,
  ProjectDocument,
  RejectDocumentPayload,
  UploadDocumentInput,
} from "../types"

/** Let axios compute the multipart boundary by clearing the default JSON header. */
const multipart: AxiosRequestConfig = { headers: { "Content-Type": undefined } }

function toUploadForm(input: UploadDocumentInput): FormData {
  const fd = new FormData()
  fd.append("project_id", input.projectId)
  fd.append("node_type", input.nodeType)
  fd.append("title", input.title)
  fd.append("document_category", input.documentCategory)
  if (input.accessLevel) fd.append("access_level", input.accessLevel)
  if (input.description) fd.append("description", input.description)
  if (input.ownerId) fd.append("owner_id", input.ownerId)
  if (input.file) fd.append("file", input.file)
  return fd
}

export const documentsApi = {
  /**
   * Project-level document library. Omit `project_id` for a portfolio-wide
   * library (up to 500 active documents across every project). Returns the
   * documents plus category/status/tag facets for the folder + tag rails.
   */
  library: (params?: DocumentLibraryParams) =>
    httpClient.get<ApiResponse<DocumentLibrary>>(`/pm/documents`, { params }),
  listForNode: (nodeId: string) =>
    httpClient.get<ApiResponse<ProjectDocument[]>>(
      `/pm/nodes/${nodeId}/documents`,
    ),
  get: (id: string) =>
    httpClient.get<ApiResponse<ProjectDocument>>(`/pm/documents/${id}`),
  upload: (nodeId: string, input: UploadDocumentInput) =>
    httpClient.post<ApiResponse<ProjectDocument>>(
      `/pm/nodes/${nodeId}/documents/upload`,
      toUploadForm(input),
      multipart,
    ),
  checkOut: (id: string) =>
    httpClient.post<ApiResponse<ProjectDocument>>(
      `/pm/documents/${id}/check-out`,
    ),
  checkIn: (id: string, input: CheckInDocumentInput) => {
    const fd = new FormData()
    fd.append("file", input.file)
    if (input.changeNotes) fd.append("change_notes", input.changeNotes)
    return httpClient.post<ApiResponse<ProjectDocument>>(
      `/pm/documents/${id}/check-in`,
      fd,
      multipart,
    )
  },
  approve: (id: string) =>
    httpClient.post<ApiResponse<ProjectDocument>>(
      `/pm/documents/${id}/approve`,
      {},
    ),
  reject: (id: string, payload: RejectDocumentPayload) =>
    httpClient.post<ApiResponse<ProjectDocument>>(
      `/pm/documents/${id}/reject`,
      payload,
    ),
  remove: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/documents/${id}`),
  versions: (id: string) =>
    httpClient.get<ApiResponse<DocumentVersion[]>>(
      `/pm/documents/${id}/versions`,
    ),
  downloadUrl: (id: string) =>
    httpClient.get<ApiResponse<DownloadUrlResponse>>(
      `/pm/documents/${id}/download`,
    ),
}
