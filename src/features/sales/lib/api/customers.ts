import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  BlockCustomerPayload,
  CreateCustomerPayload,
  Customer,
  CustomerExportFilters,
  CustomerListItem,
  CustomerListParams,
  UpdateCustomerPayload,
} from "../types"
import type { SalesExportRequest, SalesExportResult, TabbedListMeta } from "../types/common"

export const customersApi = {
  list: (params?: CustomerListParams) =>
    httpClient.get<ApiResponse<CustomerListItem[]> & { meta: TabbedListMeta }>(
      "/sales/customers",
      { params },
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Customer>>(`/sales/customers/${id}`),

  create: (payload: CreateCustomerPayload) =>
    httpClient.post<ApiResponse<Customer>>("/sales/customers", payload),

  update: (id: string, payload: UpdateCustomerPayload) =>
    httpClient.put<ApiResponse<Customer>>(`/sales/customers/${id}`, payload),

  block: (id: string, payload: BlockCustomerPayload) =>
    httpClient.post<ApiResponse<Customer>>(`/sales/customers/${id}/block`, payload),

  unblock: (id: string) =>
    httpClient.post<ApiResponse<Customer>>(`/sales/customers/${id}/unblock`),

  deactivate: (id: string) =>
    httpClient.post<ApiResponse<Customer>>(`/sales/customers/${id}/deactivate`),

  export: (payload: SalesExportRequest<CustomerExportFilters>) =>
    httpClient.post<ApiResponse<SalesExportResult>>("/sales/customers/export", payload),
}
