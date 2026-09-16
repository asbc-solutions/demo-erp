import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  Branch,
  BranchListItem,
  BranchHeadcountSummary,
  Department,
  TreeNode,
  BranchListParams,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "../types"

export const branchesApi = {
  list: (params?: BranchListParams) =>
    httpClient.get<ApiResponse<BranchListItem[]> & { meta: PaginationMeta }>(
      "/branches",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Branch>>(`/branches/${id}`),

  getDepartments: (id: string) =>
    httpClient.get<ApiResponse<Department[]>>(`/branches/${id}/departments`),

  getHeadcount: (id: string) =>
    httpClient.get<ApiResponse<BranchHeadcountSummary>>(
      `/branches/${id}/headcount`
    ),

  getHierarchy: (id: string) =>
    httpClient.get<ApiResponse<TreeNode>>(`/branches/${id}/hierarchy`),

  create: (payload: CreateBranchPayload) =>
    httpClient.post<ApiResponse<Branch>>("/branches", payload),

  update: (id: string, payload: UpdateBranchPayload) =>
    httpClient.put<ApiResponse<Branch>>(`/branches/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/branches/${id}`),
}
