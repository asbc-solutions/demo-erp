import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  Job,
  JobListParams,
  CreateJobPayload,
  UpdateJobPayload,
} from "../types"

export const jobsApi = {
  list: (params?: JobListParams) =>
    httpClient.get<ApiResponse<Job[]> & { meta: PaginationMeta }>("/jobs", {
      params,
    }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Job>>(`/jobs/${id}`),

  getFamilies: () =>
    httpClient.get<ApiResponse<string[]>>("/jobs/families"),

  clone: (id: string) =>
    httpClient.post<ApiResponse<Job>>(`/jobs/${id}/clone`),

  create: (payload: CreateJobPayload) =>
    httpClient.post<ApiResponse<Job>>("/jobs", payload),

  update: (id: string, payload: UpdateJobPayload) =>
    httpClient.put<ApiResponse<Job>>(`/jobs/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/jobs/${id}`),
}
