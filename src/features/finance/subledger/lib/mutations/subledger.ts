"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { subledgerApi } from "../api/subledger"
import type { NewNotePayload, NewVoucherPayload, Side } from "../types/subledger"

export function useWriteOffBalance(side: Side) {
  return useFinanceMutation(({ id, reason }: { id: string; reason: string }) =>
    subledgerApi.writeOff(side, id, reason).then(unwrap),
  )
}

export function useCreateNote(side: Side) {
  return useFinanceMutation((payload: NewNotePayload) =>
    subledgerApi.createNote(side, payload).then(unwrap),
  )
}

export function useCreateVoucher(side: Side) {
  return useFinanceMutation((payload: NewVoucherPayload) =>
    subledgerApi.createVoucher(side, payload).then(unwrap),
  )
}
