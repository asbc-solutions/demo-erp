"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { ledgerApi } from "../api/ledger"
import type { ImportKind, NewJournalPayload, NewRecurringPayload, NewTemplatePayload } from "../types/ledger"

export function useCreateJournal() {
  return useFinanceMutation((payload: NewJournalPayload) => ledgerApi.createJournal(payload).then(unwrap))
}

export function useJournalAction(id: string) {
  return useFinanceMutation(({ action, reason }: { action: "submit" | "post" | "send-back"; reason?: string }) =>
    ledgerApi.journalAction(id, action, reason).then(unwrap),
  )
}

export function useReverseJournal(id: string) {
  return useFinanceMutation(({ date, reason }: { date: string; reason: string }) =>
    ledgerApi.reverse(id, date, reason).then(unwrap),
  )
}

export function useCreateTemplate() {
  return useFinanceMutation((payload: NewTemplatePayload) => ledgerApi.createTemplate(payload).then(unwrap))
}

export function useCreateRecurring() {
  return useFinanceMutation((payload: NewRecurringPayload) => ledgerApi.createRecurring(payload).then(unwrap))
}

export function useToggleRecurring() {
  return useFinanceMutation((id: string) => ledgerApi.toggleRecurring(id).then(unwrap))
}

export function useRunRecurring() {
  return useFinanceMutation((id: string) => ledgerApi.runRecurring(id).then(unwrap))
}

export function useLockOpenings() {
  return useFinanceMutation(() => ledgerApi.lockOpenings().then(unwrap))
}

export function useRefreshRates() {
  return useFinanceMutation(() => ledgerApi.refreshRates().then(unwrap))
}

export function usePostRevaluation() {
  return useFinanceMutation(() => ledgerApi.postRevaluation().then(unwrap))
}

export function useImportRows() {
  return useFinanceMutation(({ kind, rows }: { kind: ImportKind; rows: Record<string, string>[] }) =>
    ledgerApi.importRows(kind, rows).then(unwrap),
  )
}
