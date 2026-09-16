import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  AcceptQuotationPayload,
  CreateQuotationPayload,
  Quotation,
  QuotationExportFilters,
  QuotationLineInput,
  QuotationListItem,
  QuotationListParams,
  QuotationPdfParams,
  RejectQuotationPayload,
  SendQuotationPayload,
  UpdateQuotationPayload,
} from "../types"
import type { SalesExportRequest, SalesExportResult, SignedDownloadUrl, TabbedListMeta } from "../types/common"

export const quotationsApi = {
  list: (params?: QuotationListParams) =>
    httpClient.get<ApiResponse<QuotationListItem[]> & { meta: TabbedListMeta }>(
      "/sales/quotations",
      { params },
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Quotation>>(`/sales/quotations/${id}`),

  create: (payload: CreateQuotationPayload) =>
    httpClient.post<ApiResponse<Quotation>>("/sales/quotations", payload),

  update: (id: string, payload: UpdateQuotationPayload) =>
    httpClient.put<ApiResponse<Quotation>>(`/sales/quotations/${id}`, payload),

  addLine: (id: string, payload: QuotationLineInput) =>
    httpClient.post<ApiResponse<Quotation>>(`/sales/quotations/${id}/lines`, payload),

  updateLine: (id: string, lineId: string, payload: Partial<QuotationLineInput>) =>
    httpClient.put<ApiResponse<Quotation>>(
      `/sales/quotations/${id}/lines/${lineId}`,
      payload,
    ),

  removeLine: (id: string, lineId: string) =>
    httpClient.delete<ApiResponse<Quotation>>(`/sales/quotations/${id}/lines/${lineId}`),

  send: (id: string, payload: SendQuotationPayload) =>
    httpClient.post<ApiResponse<Quotation>>(`/sales/quotations/${id}/send`, payload),

  accept: (id: string, payload: AcceptQuotationPayload) =>
    httpClient.post<ApiResponse<Quotation>>(`/sales/quotations/${id}/accept`, payload),

  reject: (id: string, payload: RejectQuotationPayload) =>
    httpClient.post<ApiResponse<Quotation>>(`/sales/quotations/${id}/reject`, payload),

  convert: (id: string) =>
    httpClient.post<ApiResponse<{ id: string; status: string }>>(
      `/sales/quotations/${id}/convert`,
    ),

  duplicate: (id: string) =>
    httpClient.post<ApiResponse<Quotation>>(`/sales/quotations/${id}/duplicate`),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/sales/quotations/${id}`),

  export: (payload: SalesExportRequest<QuotationExportFilters>) =>
    httpClient.post<ApiResponse<SalesExportResult>>("/sales/quotations/export", payload),

  getPdf: (id: string, params?: QuotationPdfParams) =>
    httpClient.get<ApiResponse<SignedDownloadUrl>>(`/sales/quotations/${id}/pdf`, {
      params,
    }),
}
