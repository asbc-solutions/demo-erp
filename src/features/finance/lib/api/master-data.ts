import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { ContactKind, FinanceAccount, FinanceContact, FinanceTreasury } from "../types/common"

/** Master data every section picks from: contacts, cash accounts and postable ledger accounts. */
export const masterDataApi = {
  contacts: (kind?: ContactKind) =>
    httpClient.get<ApiResponse<FinanceContact[]>>("/finance/contacts", { params: { kind } }),

  treasuries: () => httpClient.get<ApiResponse<FinanceTreasury[]>>("/finance/treasuries"),

  accounts: () => httpClient.get<ApiResponse<FinanceAccount[]>>("/finance/accounts", { params: { postable: true } }),
}
