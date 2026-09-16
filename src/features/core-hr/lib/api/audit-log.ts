import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { AuditDay, AuditEntry } from "../../types/audit"
import type { AuditHistoryMeta, AuditLogListParams } from "../types"

export const auditLogApi = {
  list: (params?: AuditLogListParams) =>
    httpClient.get<ApiResponse<AuditDay[]> & { meta: AuditHistoryMeta }>(
      "/history",
      { params },
    ),

  byEmployee: (employeeId: string, limit = 100) =>
    httpClient.get<ApiResponse<AuditDay[]>>(
      `/employees/${employeeId}/history`,
      { params: { limit } },
    ),

  detail: (id: number) =>
    httpClient.get<ApiResponse<AuditEntry>>(`/history/${id}`),
}
