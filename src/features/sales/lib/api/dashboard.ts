import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { SalesDashboard } from "../types"

export const dashboardApi = {
  get: () => httpClient.get<ApiResponse<SalesDashboard>>("/sales/dashboard"),
}
