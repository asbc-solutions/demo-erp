import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  ArDocument,
  ArOverview,
  Collections,
  CreditDocument,
  CreditList,
  CustomerCard,
  NewCreditNotePayload,
  NewReceiptPayload,
  PostReceiptPayload,
  PostedReceipt,
  Receipt,
  ReceiptList,
} from "../types/receivables"

export const receivablesApi = {
  overview: () => httpClient.get<ApiResponse<ArOverview>>("/finance/ar/overview"),

  customer: (id: string) =>
    httpClient.get<ApiResponse<CustomerCard | null>>(`/finance/ar/customers/${id}`),

  writeOff: (id: string, reason: string) =>
    httpClient.post<ApiResponse<{ written_off_base: number }>>(
      `/finance/ar/customers/${id}/write-off`,
      { reason },
    ),

  openInvoices: (customerId: string) =>
    httpClient.get<ApiResponse<ArDocument[]>>("/finance/ar/open-invoices", {
      params: { customer_id: customerId },
    }),

  collections: () => httpClient.get<ApiResponse<Collections>>("/finance/ar/collections"),

  creditNotes: () => httpClient.get<ApiResponse<CreditList>>("/finance/ar/credit-notes"),

  createCreditNote: (payload: NewCreditNotePayload) =>
    httpClient.post<ApiResponse<CreditDocument>>("/finance/ar/credit-notes", payload),

  advances: () => httpClient.get<ApiResponse<CreditList>>("/finance/ar/advances"),

  receipts: () => httpClient.get<ApiResponse<ReceiptList>>("/finance/receipts"),

  createReceipt: (payload: NewReceiptPayload) =>
    httpClient.post<ApiResponse<Receipt>>("/finance/receipts", payload),

  postReceipt: (payload: PostReceiptPayload) =>
    httpClient.post<ApiResponse<PostedReceipt>>("/finance/ar/receipts", payload),

  unallocate: (receiptId: string) =>
    httpClient.post<ApiResponse<Receipt>>(`/finance/ar/receipts/${receiptId}/unallocate`),
}
