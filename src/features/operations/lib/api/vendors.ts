import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CreateVendorPayload,
  RenewVendorPayload,
  VendorKpis,
  VendorListItem,
  VendorListParams,
} from "../types"

export const vendorsApi = {
  list: (params?: VendorListParams) =>
    httpClient.get<ApiResponse<VendorListItem[]>>("/operations/vendors", { params }),

  kpis: () => httpClient.get<ApiResponse<VendorKpis>>("/operations/vendors/kpis"),

  create: (payload: CreateVendorPayload) =>
    httpClient.post<ApiResponse<VendorListItem>>("/operations/vendors", payload),

  /** Dedicated action endpoint — mirrors Sales' customer block/unblock pattern. */
  activate: (id: string) =>
    httpClient.post<ApiResponse<VendorListItem>>(`/operations/vendors/${id}/activate`),

  /** Dedicated action endpoint. Extends the contract and flips status back to active. */
  renew: (id: string, payload: RenewVendorPayload) =>
    httpClient.post<ApiResponse<VendorListItem>>(`/operations/vendors/${id}/renew`, payload),
}
