import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { FinanceReportType } from "../constants/report-types"
import type { FinanceReportCard, FinanceReportExportResult, FinanceReportRow } from "../types"

export const reportsApi = {
  listCards: () => httpClient.get<ApiResponse<FinanceReportCard[]>>("/finance/reports"),

  getRows: (type: FinanceReportType) =>
    httpClient.get<ApiResponse<FinanceReportRow[]>>(`/finance/reports/${type}`),

  exportCsv: (type: FinanceReportType) =>
    httpClient.post<ApiResponse<FinanceReportExportResult>>(`/finance/reports/${type}/export`),
}
