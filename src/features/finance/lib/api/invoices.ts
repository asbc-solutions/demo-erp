import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  CancelFinanceInvoiceResult,
  CreateFinanceInvoiceResult,
  FinanceInvoiceDetail,
  FinanceInvoiceListItem,
  FinanceInvoiceListMeta,
  FinanceInvoiceListParams,
  MarkFinanceInvoicePaidPayload,
  MarkFinanceInvoicePaidResult,
  SaveFinanceInvoicePayload,
  SendFinanceInvoiceResult,
  UpdateFinanceInvoiceResult,
} from "../types"

export const invoicesApi = {
  list: (params?: FinanceInvoiceListParams) =>
    httpClient.get<ApiResponse<FinanceInvoiceListItem[]> & { meta: FinanceInvoiceListMeta }>(
      "/finance/invoices",
      { params },
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<FinanceInvoiceDetail>>(`/finance/invoices/${id}`),

  create: (payload: SaveFinanceInvoicePayload) =>
    httpClient.post<ApiResponse<CreateFinanceInvoiceResult>>("/finance/invoices", payload),

  update: (id: string, payload: SaveFinanceInvoicePayload) =>
    httpClient.put<ApiResponse<UpdateFinanceInvoiceResult>>(`/finance/invoices/${id}`, payload),

  send: (id: string) =>
    httpClient.post<ApiResponse<SendFinanceInvoiceResult>>(`/finance/invoices/${id}/send`),

  markPaid: (id: string, payload: MarkFinanceInvoicePaidPayload) =>
    httpClient.post<ApiResponse<MarkFinanceInvoicePaidResult>>(
      `/finance/invoices/${id}/mark-paid`,
      payload,
    ),

  cancel: (id: string) =>
    httpClient.post<ApiResponse<CancelFinanceInvoiceResult>>(`/finance/invoices/${id}/cancel`),
}
