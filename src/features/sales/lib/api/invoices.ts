import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CancelInvoicePayload,
  Invoice,
  InvoiceExportFilters,
  InvoiceListItem,
  InvoiceListParams,
  InvoicePdfParams,
  InvoicePrintUrlParams,
  MarkInvoiceSentPayload,
} from "../types"
import type { SalesExportRequest, SalesExportResult, SignedDownloadUrl, TabbedListMeta } from "../types/common"

export const invoicesApi = {
  list: (params?: InvoiceListParams) =>
    httpClient.get<ApiResponse<InvoiceListItem[]> & { meta: TabbedListMeta }>(
      "/sales/invoices",
      { params },
    ),

  getById: (id: string) => httpClient.get<ApiResponse<Invoice>>(`/sales/invoices/${id}`),

  post: (id: string) => httpClient.post<ApiResponse<Invoice>>(`/sales/invoices/${id}/post`),

  markSent: (id: string, payload: MarkInvoiceSentPayload) =>
    httpClient.post<ApiResponse<Invoice>>(`/sales/invoices/${id}/mark-sent`, payload),

  close: (id: string) => httpClient.post<ApiResponse<Invoice>>(`/sales/invoices/${id}/close`),

  cancel: (id: string, payload: CancelInvoicePayload) =>
    httpClient.post<ApiResponse<Invoice>>(`/sales/invoices/${id}/cancel`, payload),

  getPdf: (id: string, params?: InvoicePdfParams) =>
    httpClient.get<ApiResponse<SignedDownloadUrl>>(`/sales/invoices/${id}/pdf`, { params }),

  getPrintUrl: (id: string, params?: InvoicePrintUrlParams) =>
    httpClient.get<ApiResponse<{ print_url: string }>>(`/sales/invoices/${id}/print-url`, {
      params,
    }),

  export: (payload: SalesExportRequest<InvoiceExportFilters>) =>
    httpClient.post<ApiResponse<SalesExportResult>>("/sales/invoices/export", payload),
}
