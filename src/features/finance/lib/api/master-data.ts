import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { ContactKind, FinanceContact, FinanceTreasury } from "../types/common"

/** Master data every section picks from: contacts and cash accounts. */
export const masterDataApi = {
  contacts: (kind?: ContactKind) =>
    httpClient.get<ApiResponse<FinanceContact[]>>("/finance/contacts", { params: { kind } }),

  treasuries: () => httpClient.get<ApiResponse<FinanceTreasury[]>>("/finance/treasuries"),
}
