import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  JobGrade,
  JobGradeListItem,
  JobGradeListParams,
  CreateJobGradePayload,
  UpdateJobGradePayload,
  ValidateBandPayload,
  ValidateBandResult,
} from "../types"

export const jobGradesApi = {
  list: (params?: JobGradeListParams) =>
    httpClient.get<ApiResponse<JobGradeListItem[]> & { meta: PaginationMeta }>(
      "/job-grades",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<JobGrade>>(`/job-grades/${id}`),

  validateBand: (payload: ValidateBandPayload) =>
    httpClient.post<ApiResponse<ValidateBandResult>>(
      "/job-grades/validate-band",
      payload
    ),

  create: (payload: CreateJobGradePayload) =>
    httpClient.post<ApiResponse<JobGrade>>("/job-grades", payload),

  update: (id: string, payload: UpdateJobGradePayload) =>
    httpClient.put<ApiResponse<JobGrade>>(`/job-grades/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/job-grades/${id}`),
}
