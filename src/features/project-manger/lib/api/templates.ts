import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { ProjectTemplate, TemplateListParams } from "../types"

export const templatesApi = {
  list: (params?: TemplateListParams) =>
    httpClient.get<ApiResponse<ProjectTemplate[]>>("/pm/project-templates", {
      params,
    }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<ProjectTemplate>>(`/pm/project-templates/${id}`),
}
