import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { CommandCenterSummary } from "../types/summary"

export const commandCenterSummaryApi = {
  get: () =>
    httpClient.get<ApiResponse<CommandCenterSummary>>("/command-center/summary"),
}
