import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { Payment, RecordPaymentPayload, VoidPaymentPayload } from "../types"

export const paymentsApi = {
  list: (invoiceId: string) =>
    httpClient.get<ApiResponse<Payment[]>>(`/sales/invoices/${invoiceId}/payments`),

  record: (invoiceId: string, payload: RecordPaymentPayload) =>
    httpClient.post<ApiResponse<Payment>>(`/sales/invoices/${invoiceId}/payments`, payload),

  void: (paymentId: string, payload: VoidPaymentPayload) =>
    httpClient.post<ApiResponse<Payment>>(`/sales/payments/${paymentId}/void`, payload),
}
