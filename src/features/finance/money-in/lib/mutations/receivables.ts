"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { financeKeys } from "../../../lib/constants/query-keys"
import { receivablesApi } from "../api/receivables"
import type {
  NewCreditNotePayload,
  NewReceiptPayload,
  PostReceiptPayload,
} from "../types/receivables"

/**
 * Every receivables write can move AR totals, cash, the attention list and nav
 * badges, so each one refreshes the whole finance module.
 */
function useFinanceMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

export function useWriteOffBalance() {
  return useFinanceMutation(({ id, reason }: { id: string; reason: string }) =>
    receivablesApi.writeOff(id, reason).then((r) => r.data.data),
  )
}

export function useCreateCreditNote() {
  return useFinanceMutation((payload: NewCreditNotePayload) =>
    receivablesApi.createCreditNote(payload).then((r) => r.data.data),
  )
}

export function useCreateReceipt() {
  return useFinanceMutation((payload: NewReceiptPayload) =>
    receivablesApi.createReceipt(payload).then((r) => r.data.data),
  )
}

export function usePostReceipt() {
  return useFinanceMutation((payload: PostReceiptPayload) =>
    receivablesApi.postReceipt(payload).then((r) => r.data.data),
  )
}

export function useUnallocateReceipt() {
  return useFinanceMutation((receiptId: string) =>
    receivablesApi.unallocate(receiptId).then((r) => r.data.data),
  )
}
