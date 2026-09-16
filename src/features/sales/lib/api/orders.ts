import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CancelOrderPayload,
  ConfirmOrderPayload,
  GenerateInvoicePayload,
  Order,
  OrderExportFilters,
  OrderListItem,
  OrderListParams,
  OrderPdfParams,
  RequestEditOrderPayload,
  UpdateOrderLinesPayload,
} from "../types"
import type { SalesExportRequest, SalesExportResult, SignedDownloadUrl, TabbedListMeta } from "../types/common"

export const ordersApi = {
  list: (params?: OrderListParams) =>
    httpClient.get<ApiResponse<OrderListItem[]> & { meta: TabbedListMeta }>(
      "/sales/orders",
      { params },
    ),

  getById: (id: string) => httpClient.get<ApiResponse<Order>>(`/sales/orders/${id}`),

  confirm: (id: string, payload: ConfirmOrderPayload) =>
    httpClient.post<ApiResponse<Order>>(`/sales/orders/${id}/confirm`, payload),

  requestEdit: (id: string, payload: RequestEditOrderPayload) =>
    httpClient.post<ApiResponse<{ valid: boolean }>>(
      `/sales/orders/${id}/request-edit`,
      payload,
    ),

  updateLines: (id: string, payload: UpdateOrderLinesPayload) =>
    httpClient.put<ApiResponse<Order>>(`/sales/orders/${id}/lines`, payload),

  cancel: (id: string, payload: CancelOrderPayload) =>
    httpClient.post<ApiResponse<Order>>(`/sales/orders/${id}/cancel`, payload),

  generateInvoice: (id: string, payload: GenerateInvoicePayload) =>
    httpClient.post<ApiResponse<{ id: string; status: string }>>(
      `/sales/orders/${id}/generate-invoice`,
      payload,
    ),

  getPdf: (id: string, params?: OrderPdfParams) =>
    httpClient.get<ApiResponse<SignedDownloadUrl>>(`/sales/orders/${id}/pdf`, { params }),

  export: (payload: SalesExportRequest<OrderExportFilters>) =>
    httpClient.post<ApiResponse<SalesExportResult>>("/sales/orders/export", payload),
}
