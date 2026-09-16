import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  CreateDocumentPayload,
  DocumentDownloadResponse,
  DocumentListParams,
  EmployeeDocument,
  ExpiringDocumentsMeta,
  ExpiringDocumentsParams,
  UpdateDocumentPayload,
  VerifyDocumentPayload,
} from "../types"

type DocumentListResponse = Omit<ApiResponse<EmployeeDocument[]>, "meta"> & {
  meta: PaginationMeta
}

type ExpiringDocumentsResponse = Omit<ApiResponse<EmployeeDocument[]>, "meta"> & {
  meta: ExpiringDocumentsMeta
}

export const documentsApi = {
  list: (params?: DocumentListParams) =>
    httpClient.get<DocumentListResponse>("/documents", { params }),

  byEmployee: (employeeId: string) =>
    httpClient.get<ApiResponse<EmployeeDocument[]>>(
      `/employees/${employeeId}/documents`
    ),

  create: (employeeId: string, payload: CreateDocumentPayload) => {
    const form = new FormData()
    form.append("document_type", payload.document_type)
    form.append("document_category", payload.document_category)
    form.append("document_title", payload.document_title)
    if (payload.document_number) form.append("document_number", payload.document_number)
    if (payload.issuing_authority) form.append("issuing_authority", payload.issuing_authority)
    if (payload.issuing_country) form.append("issuing_country", payload.issuing_country)
    if (payload.issue_date) form.append("issue_date", payload.issue_date)
    if (payload.expiry_date) form.append("expiry_date", payload.expiry_date)
    if (payload.alert_days_before !== undefined)
      form.append("alert_days_before", String(payload.alert_days_before))
    if (payload.is_mandatory !== undefined)
      form.append("is_mandatory", payload.is_mandatory ? "1" : "0")
    if (payload.document) form.append("document", payload.document)
    return httpClient.post<ApiResponse<EmployeeDocument>>(
      `/employees/${employeeId}/documents`,
      form,
      { headers: { "Content-Type": undefined } }
    )
  },

  update: (employeeId: string, id: string, payload: UpdateDocumentPayload) =>
    httpClient.put<ApiResponse<EmployeeDocument>>(
      `/employees/${employeeId}/documents/${id}`,
      payload
    ),

  verify: (employeeId: string, id: string, payload: VerifyDocumentPayload = {}) =>
    httpClient.put<ApiResponse<EmployeeDocument>>(
      `/employees/${employeeId}/documents/${id}/verify`,
      payload
    ),

  reject: (employeeId: string, id: string, payload: VerifyDocumentPayload = {}) =>
    httpClient.put<ApiResponse<EmployeeDocument>>(
      `/employees/${employeeId}/documents/${id}/reject`,
      payload
    ),

  delete: (employeeId: string, id: string) =>
    httpClient.delete<ApiResponse<null>>(
      `/employees/${employeeId}/documents/${id}`
    ),

  download: (employeeId: string, id: string) =>
    httpClient.get<ApiResponse<DocumentDownloadResponse>>(
      `/employees/${employeeId}/documents/${id}/download`
    ),

  expiring: (params?: ExpiringDocumentsParams) =>
    httpClient.get<ExpiringDocumentsResponse>("/documents/expiring", { params }),
}
