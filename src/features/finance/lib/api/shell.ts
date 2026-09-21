import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { FinanceEntity, FinancePeriod } from "../types/common"
import type { FinanceNavCounts, FinanceSearchResults } from "../types/shell"

export const financeShellApi = {
  entities: () => httpClient.get<ApiResponse<FinanceEntity[]>>("/finance/entities"),

  periods: () => httpClient.get<ApiResponse<FinancePeriod[]>>("/finance/periods"),

  navCounts: () => httpClient.get<ApiResponse<FinanceNavCounts>>("/finance/nav-counts"),

  search: (q: string) =>
    httpClient.get<ApiResponse<FinanceSearchResults>>("/finance/search", { params: { q } }),
}
