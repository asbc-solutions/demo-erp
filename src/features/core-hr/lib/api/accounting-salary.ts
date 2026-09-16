import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  AccountingSalary,
  AccountingSalaryListParams,
  CreateAccountingSalaryPayload,
} from "../types"

export const accountingSalaryApi = {
  list: (params?: AccountingSalaryListParams) =>
    httpClient.get<ApiResponse<AccountingSalary[]> & { meta: PaginationMeta }>(
      "/accounting-salary",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<AccountingSalary>>(`/accounting-salary/${id}`),

  create: (payload: CreateAccountingSalaryPayload) =>
    httpClient.post<ApiResponse<AccountingSalary>>(
      "/accounting-salary",
      payload
    ),

  postToGL: (id: string) =>
    httpClient.put<ApiResponse<AccountingSalary>>(
      `/accounting-salary/${id}/post`
    ),

  reverse: (id: string) =>
    httpClient.put<ApiResponse<AccountingSalary>>(
      `/accounting-salary/${id}/reverse`
    ),
}
