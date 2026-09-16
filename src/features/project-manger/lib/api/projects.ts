import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  Project,
  ProjectListItem,
  ProjectListParams,
  ProjectStakeholder,
  ProjectStats,
  ImportProjectsResult,
  CreateProjectPayload,
  UpdateProjectPayload,
  AddStakeholderPayload,
} from "../types"

export const projectsApi = {
  list: (params?: ProjectListParams) =>
    httpClient.get<ApiResponse<ProjectListItem[]> & { meta: PaginationMeta }>(
      "/pm/projects",
      { params },
    ),

  stats: () => httpClient.get<ApiResponse<ProjectStats>>("/pm/projects/stats"),

  import: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return httpClient.post<ApiResponse<ImportProjectsResult>>(
      "/pm/projects/import",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
  },

  follow: (id: string) =>
    httpClient.post<ApiResponse<{ following: boolean }>>(
      `/pm/projects/${id}/follow`,
    ),

  unfollow: (id: string) =>
    httpClient.delete<ApiResponse<{ following: boolean }>>(
      `/pm/projects/${id}/follow`,
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Project>>(`/pm/projects/${id}`),

  create: (payload: CreateProjectPayload) =>
    httpClient.post<ApiResponse<Project>>("/pm/projects", payload),

  update: (id: string, payload: UpdateProjectPayload) =>
    httpClient.put<ApiResponse<Project>>(`/pm/projects/${id}`, payload),

  release: (id: string) =>
    httpClient.post<ApiResponse<Project>>(`/pm/projects/${id}/release`),

  listStakeholders: (id: string) =>
    httpClient.get<ApiResponse<ProjectStakeholder[]>>(
      `/pm/projects/${id}/stakeholders`,
    ),

  addStakeholder: (id: string, payload: AddStakeholderPayload) =>
    httpClient.post<ApiResponse<ProjectStakeholder>>(
      `/pm/projects/${id}/stakeholders`,
      payload,
    ),

  removeStakeholder: (id: string, stakeholderId: string) =>
    httpClient.delete<ApiResponse<null>>(
      `/pm/projects/${id}/stakeholders/${stakeholderId}`,
    ),
}
