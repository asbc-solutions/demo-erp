import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  ChangeSalaryPayload,
  CreateSalaryPayload,
  CurrentSalaryResponse,
  SalaryAnalytics,
  SalaryHistoryResponse,
  SalaryPreview,
  SalaryRecord,
} from "../types"

export const salariesApi = {
  analytics: () =>
    httpClient.get<ApiResponse<SalaryAnalytics>>("/salary/analytics"),

  create: (employeeId: string, payload: CreateSalaryPayload) =>
    httpClient.post<ApiResponse<SalaryRecord>>(
      `/employees/${employeeId}/salary`,
      payload
    ),

  history: (employeeId: string) =>
    httpClient.get<ApiResponse<SalaryHistoryResponse>>(
      `/employees/${employeeId}/salary`
    ),

  current: (employeeId: string) =>
    httpClient.get<ApiResponse<CurrentSalaryResponse>>(
      `/employees/${employeeId}/salary/current`
    ),

  change: (employeeId: string, payload: ChangeSalaryPayload) =>
    httpClient.post<ApiResponse<SalaryRecord>>(
      `/employees/${employeeId}/salary/change`,
      payload
    ),

  preview: (employeeId: string, payload: Partial<CreateSalaryPayload>) =>
    httpClient.post<ApiResponse<SalaryPreview>>(
      `/employees/${employeeId}/salary/preview`,
      payload
    ),
}
