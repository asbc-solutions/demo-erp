"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { bankingApi } from "../api/banking"
import type {
  NewChequeBookPayload,
  NewChequePayload,
  NewCustodyPayload,
  NewTransferPayload,
  SettleCustodyPayload,
} from "../types/banking"

type Pair = { lineId: string; entryId: string }

/** Reconciliation writes for one bank account. */
export function useReconciliationActions(treasuryId: string) {
  return {
    match: useFinanceMutation(({ lineId, entryId }: Pair) =>
      bankingApi.matchPair(treasuryId, lineId, entryId).then(unwrap),
    ),
    acceptAll: useFinanceMutation((min: number) => bankingApi.acceptAll(treasuryId, min).then(unwrap)),
    dismiss: useFinanceMutation(({ lineId, entryId }: Pair) =>
      bankingApi.dismiss(treasuryId, lineId, entryId).then(unwrap),
    ),
    unmatch: useFinanceMutation((lineId: string) => bankingApi.unmatch(treasuryId, lineId).then(unwrap)),
    createEntry: useFinanceMutation(({ lineId, counterAccount }: { lineId: string; counterAccount: string }) =>
      bankingApi.createEntry(treasuryId, lineId, counterAccount).then(unwrap),
    ),
    finish: useFinanceMutation(() => bankingApi.finish(treasuryId).then(unwrap)),
  }
}

export function useImportStatement() {
  return useFinanceMutation((treasuryId: string) => bankingApi.importStatement(treasuryId).then(unwrap))
}

export function useCreateTransfer() {
  return useFinanceMutation((payload: NewTransferPayload) => bankingApi.createTransfer(payload).then(unwrap))
}

export function useCreateCheque() {
  return useFinanceMutation((payload: NewChequePayload) => bankingApi.createCheque(payload).then(unwrap))
}

export function useMoveCheque() {
  return useFinanceMutation(({ id, status }: { id: string; status: string }) =>
    bankingApi.moveCheque(id, status).then(unwrap),
  )
}

export function useCreateChequeBook() {
  return useFinanceMutation((payload: NewChequeBookPayload) => bankingApi.createChequeBook(payload).then(unwrap))
}

export function useCreateCustody() {
  return useFinanceMutation((payload: NewCustodyPayload) => bankingApi.createCustody(payload).then(unwrap))
}

export function useSettleCustody(id: string) {
  return useFinanceMutation((payload: SettleCustodyPayload) => bankingApi.settleCustody(id, payload).then(unwrap))
}

export function useWriteOffCustody(id: string) {
  return useFinanceMutation((reason: string) => bankingApi.writeOffCustody(id, reason).then(unwrap))
}
