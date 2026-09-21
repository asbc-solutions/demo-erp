import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"
import type {
  ApprovalQueue,
  Expense,
  ExpenseList,
  NewExpensePayload,
  PaymentRunCandidates,
  PaymentRunResult,
  PostPaymentRunPayload,
} from "../types/payables"

/** The payables-only endpoints; the shared subledger ones live in `subledgerApi`. */
export const payablesApi = {
  approvals: () => httpClient.get<ApiResponse<ApprovalQueue>>("/finance/ap/approvals"),

  approveBill: (id: string) =>
    httpClient.post<ApiResponse<SubledgerDocument>>(`/finance/ap/approvals/${id}/approve`),

  sendBackBill: (id: string, reason: string) =>
    httpClient.post<ApiResponse<SubledgerDocument>>(`/finance/ap/approvals/${id}/send-back`, { reason }),

  paymentRunCandidates: () =>
    httpClient.get<ApiResponse<PaymentRunCandidates>>("/finance/ap/payment-runs/candidates"),

  postPaymentRun: (payload: PostPaymentRunPayload) =>
    httpClient.post<ApiResponse<PaymentRunResult>>("/finance/ap/payment-runs", payload),

  expenses: () => httpClient.get<ApiResponse<ExpenseList>>("/finance/expenses"),

  createExpense: (payload: NewExpensePayload) =>
    httpClient.post<ApiResponse<Expense>>("/finance/expenses", payload),

  approveExpense: (id: string) => httpClient.post<ApiResponse<Expense>>(`/finance/expenses/${id}/approve`),
}
