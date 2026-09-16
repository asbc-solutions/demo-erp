import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { SalesMasterData } from "../types"

export const masterDataApi = {
  get: () => httpClient.get<ApiResponse<SalesMasterData>>("/sales/master-data"),
}
