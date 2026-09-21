"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { receivablesApi } from "../api/receivables"
import type { PostReceiptPayload } from "../types/receivables"

export function usePostReceipt() {
  return useFinanceMutation((payload: PostReceiptPayload) =>
    receivablesApi.postReceipt(payload).then(unwrap),
  )
}

export function useUnallocateReceipt() {
  return useFinanceMutation((receiptId: string) =>
    receivablesApi.unallocate(receiptId).then(unwrap),
  )
}
