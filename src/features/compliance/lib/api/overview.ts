import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { ComplianceScore, CriticalAlert, CriticalAlertsParams } from "../types/overview"

export const complianceOverviewApi = {
  getScore: () => httpClient.get<ApiResponse<ComplianceScore>>("/compliance/score"),

  listAlerts: (params?: CriticalAlertsParams) =>
    httpClient.get<ApiResponse<CriticalAlert[]>>("/compliance/alerts", { params }),
}
