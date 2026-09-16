import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { RecentInvoice, RecentInvoicesParams } from "../types/recent-invoices"

export const recentInvoicesApi = {
  list: (params?: RecentInvoicesParams) =>
    httpClient.get<ApiResponse<RecentInvoice[]>>("/command-center/recent-invoices", {
      params,
    }),
}
