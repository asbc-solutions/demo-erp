import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  CostCenter,
  CostCenterListParams,
  CreateCostCenterPayload,
  UpdateCostCenterPayload,
  SalarySummary,
  TreeNode,
} from "../types"

export const costCentersApi = {
  list: (params: CostCenterListParams) =>
    httpClient.get<ApiResponse<CostCenter[]> & { meta: PaginationMeta }>(
      "/cost-centers",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<CostCenter>>(`/cost-centers/${id}`),

  getHierarchy: (id: string) =>
    httpClient.get<ApiResponse<TreeNode>>(`/cost-centers/${id}/hierarchy`),

  getSalarySummary: (id: string) =>
    httpClient.get<ApiResponse<SalarySummary>>(
      `/cost-centers/${id}/salary-summary`
    ),

  create: (payload: CreateCostCenterPayload) =>
    httpClient.post<ApiResponse<CostCenter>>("/cost-centers", payload),

  update: (id: string, payload: UpdateCostCenterPayload) =>
    httpClient.put<ApiResponse<CostCenter>>(`/cost-centers/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/cost-centers/${id}`),
}
