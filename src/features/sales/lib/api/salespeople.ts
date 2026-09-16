import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CreateSalespersonPayload,
  Salesperson,
  SalespersonListParams,
  UpdateSalespersonPayload,
} from "../types"

export const salespeopleApi = {
  list: (params?: SalespersonListParams) =>
    httpClient.get<ApiResponse<Salesperson[]>>("/sales/salespeople", { params }),

  active: () =>
    httpClient.get<ApiResponse<Salesperson[]>>("/sales/salespeople/active"),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Salesperson>>(`/sales/salespeople/${id}`),

  create: (payload: CreateSalespersonPayload) =>
    httpClient.post<ApiResponse<Salesperson>>("/sales/salespeople", payload),

  update: (id: string, payload: UpdateSalespersonPayload) =>
    httpClient.put<ApiResponse<Salesperson>>(`/sales/salespeople/${id}`, payload),
}
