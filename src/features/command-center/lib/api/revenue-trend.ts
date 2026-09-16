import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { RevenueTrendPoint, RevenueTrendRange } from "../types/revenue-trend"

export const revenueTrendApi = {
  list: (range?: RevenueTrendRange) =>
    httpClient.get<ApiResponse<RevenueTrendPoint[]>>("/command-center/revenue-trend", {
      params: { range },
    }),
}
