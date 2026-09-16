import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CreateProjectPayload,
  ProjectKpis,
  ProjectListItem,
  ProjectListParams,
  UpdateProjectPayload,
} from "../types"

export const projectsApi = {
  list: (params?: ProjectListParams) =>
    httpClient.get<ApiResponse<ProjectListItem[]>>("/operations/projects", { params }),

  kpis: () => httpClient.get<ApiResponse<ProjectKpis>>("/operations/projects/kpis"),

  create: (payload: CreateProjectPayload) =>
    httpClient.post<ApiResponse<ProjectListItem>>("/operations/projects", payload),

  update: (id: string, payload: UpdateProjectPayload) =>
    httpClient.put<ApiResponse<ProjectListItem>>(`/operations/projects/${id}`, payload),
}
