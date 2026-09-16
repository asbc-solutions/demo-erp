import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  BillingInvoice,
  BillingInvoiceStatus,
  BillingOverview,
  ChangePlanPayload,
  DownloadInvoiceResult,
  SavePaymentMethodPayload,
  SavePaymentMethodResult,
} from "../types/billing"

export const billingApi = {
  overview: () => httpClient.get<ApiResponse<BillingOverview>>("/settings/billing"),

  /** Upserts the subscription and returns the same shape as `overview()`. */
  changePlan: (payload: ChangePlanPayload) =>
    httpClient.post<ApiResponse<BillingOverview>>(
      "/settings/billing/change-plan",
      payload,
    ),

  invoices: (status?: BillingInvoiceStatus) =>
    httpClient.get<ApiResponse<BillingInvoice[]>>("/settings/billing/invoices", {
      params: { status },
    }),

  /** Returns a 15-minute signed URL — open it directly, never construct a storage path client-side. */
  downloadInvoice: (invoiceId: string) =>
    httpClient.get<ApiResponse<DownloadInvoiceResult>>(
      `/settings/billing/invoices/${invoiceId}/download`,
    ),

  /**
   * Token-only. The backend rejects raw card numbers/CVC — this must be called
   * with the token a payment provider SDK (Stripe/Paymob/Fawry) already
   * produced client-side, never a PAN.
   */
  savePaymentMethod: (payload: SavePaymentMethodPayload) =>
    httpClient.put<ApiResponse<SavePaymentMethodResult>>(
      "/settings/billing/payment-method",
      payload,
    ),
}
