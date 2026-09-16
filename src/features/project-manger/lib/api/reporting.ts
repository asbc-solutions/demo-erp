import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { PortfolioDashboard } from "../types"

export const reportingApi = {
  /** Portfolio-wide analytics: KPIs, status/type breakdowns, trends, financials. */
  portfolioDashboard: () =>
    httpClient.get<ApiResponse<PortfolioDashboard>>("/pm/portfolio/dashboard"),
}
