"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { payablesApi } from "../api/payables"
import type { NewExpensePayload, PostPaymentRunPayload } from "../types/payables"

/** Approving or sending back moves a bill out of the queue and changes nav badges. */
export function useApproveBill() {
  return useFinanceMutation((id: string) => payablesApi.approveBill(id).then(unwrap))
}

export function useSendBackBill() {
  return useFinanceMutation(({ id, reason }: { id: string; reason: string }) =>
    payablesApi.sendBackBill(id, reason).then(unwrap),
  )
}

export function usePostPaymentRun() {
  return useFinanceMutation((payload: PostPaymentRunPayload) =>
    payablesApi.postPaymentRun(payload).then(unwrap),
  )
}

export function useCreateExpense() {
  return useFinanceMutation((payload: NewExpensePayload) =>
    payablesApi.createExpense(payload).then(unwrap),
  )
}

export function useApproveExpense() {
  return useFinanceMutation((id: string) => payablesApi.approveExpense(id).then(unwrap))
}
