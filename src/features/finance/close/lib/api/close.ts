import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { FinancePeriod } from "../../../lib/types/common"
import type { AdjustmentList, CloseTask, CloseWorkspace, PeriodList, YearEnd } from "../types/close"

export const closeApi = {
  workspace: () => httpClient.get<ApiResponse<CloseWorkspace>>("/finance/close"),

  setTaskStatus: (id: string, status: string) =>
    httpClient.post<ApiResponse<CloseTask>>(`/finance/close/tasks/${id}/status`, { status }),

  periods: () => httpClient.get<ApiResponse<PeriodList>>("/finance/close/periods"),

  closePeriod: (id: string) => httpClient.post<ApiResponse<FinancePeriod>>(`/finance/close/periods/${id}/close`),

  reopenPeriod: (id: string, reason: string) =>
    httpClient.post<ApiResponse<FinancePeriod>>(`/finance/close/periods/${id}/reopen`, { reason }),

  yearEnd: () => httpClient.get<ApiResponse<YearEnd>>("/finance/close/year-end"),

  completeStep: (id: string) => httpClient.post<ApiResponse<YearEnd>>(`/finance/close/year-end/steps/${id}`),

  lockYear: () => httpClient.post<ApiResponse<YearEnd>>("/finance/close/year-end/lock"),

  adjustments: () => httpClient.get<ApiResponse<AdjustmentList>>("/finance/close/adjustments"),
}
