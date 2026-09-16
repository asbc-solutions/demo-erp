import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  PositionListItem,
  PositionListParams,
  CreatePositionPayload,
  UpdatePositionPayload,
} from "../types"

export const positionsApi = {
  list: (params?: PositionListParams) =>
    httpClient.get<ApiResponse<PositionListItem[]> & { meta: PaginationMeta }>(
      "/positions",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<PositionListItem>>(`/positions/${id}`),

  create: (payload: CreatePositionPayload) =>
    httpClient.post<ApiResponse<PositionListItem>>("/positions", payload),

  update: (id: string, payload: UpdatePositionPayload) =>
    httpClient.put<ApiResponse<PositionListItem>>(`/positions/${id}`, payload),

  close: (id: string) =>
    httpClient.post<ApiResponse<PositionListItem>>(`/positions/${id}/close`),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/positions/${id}`),
}
