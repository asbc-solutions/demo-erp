import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { SubledgerDocument, Voucher } from "../../../subledger/lib/types/subledger"
import type { Collections, PostReceiptPayload, PostedReceipt } from "../types/receivables"

/** The receivables-only endpoints; the shared subledger ones live in `subledgerApi`. */
export const receivablesApi = {
  openInvoices: (customerId: string) =>
    httpClient.get<ApiResponse<SubledgerDocument[]>>("/finance/ar/open-invoices", {
      params: { contact_id: customerId },
    }),

  collections: () => httpClient.get<ApiResponse<Collections>>("/finance/ar/collections"),

  postReceipt: (payload: PostReceiptPayload) =>
    httpClient.post<ApiResponse<PostedReceipt>>("/finance/ar/receipts", payload),

  unallocate: (receiptId: string) =>
    httpClient.post<ApiResponse<Voucher>>(`/finance/ar/receipts/${receiptId}/unallocate`),
}
