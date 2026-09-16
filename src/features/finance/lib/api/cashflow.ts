import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  FinanceCashflowRange,
  FinanceCashflowRunway,
  FinanceCashflowTimelinePoint,
} from "../types"

export const cashflowApi = {
  timeline: (range?: FinanceCashflowRange) =>
    httpClient.get<ApiResponse<FinanceCashflowTimelinePoint[]>>("/finance/cashflow/timeline", {
      params: { range },
    }),

  runway: () => httpClient.get<ApiResponse<FinanceCashflowRunway>>("/finance/cashflow/runway"),
}
