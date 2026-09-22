import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { AuditLog, TrialBalance } from "../types/reports"

export const reportsApi = {
  trialBalance: () => httpClient.get<ApiResponse<TrialBalance>>("/finance/reports/trial-balance"),

  auditLog: () => httpClient.get<ApiResponse<AuditLog>>("/finance/audit"),
}
