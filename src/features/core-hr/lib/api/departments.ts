import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  Department,
  DeptPositionSummary,
  TreeNode,
  DeptListParams,
  CreateDeptPayload,
  UpdateDeptPayload,
} from "../types"

export const departmentsApi = {
  list: (params?: DeptListParams) =>
    httpClient.get<ApiResponse<Department[]> & { meta: PaginationMeta }>(
      "/departments",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Department>>(`/departments/${id}`),

  getPositions: (id: string) =>
    httpClient.get<ApiResponse<DeptPositionSummary[]>>(
      `/departments/${id}/positions`
    ),

  getTree: (id: string) =>
    httpClient.get<ApiResponse<TreeNode>>(`/departments/${id}/tree`),

  create: (payload: CreateDeptPayload) =>
    httpClient.post<ApiResponse<Department>>("/departments", payload),

  update: (id: string, payload: UpdateDeptPayload) =>
    httpClient.put<ApiResponse<Department>>(`/departments/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/departments/${id}`),
}
