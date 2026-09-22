"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { ledgerApi } from "../api/ledger"
import { ledgerKeys } from "../constants/query-keys"
import type { JournalFilters } from "../types/ledger"

export function useLedgerAccounts() {
  return useQuery({
    queryKey: ledgerKeys.accounts(),
    queryFn: () => ledgerApi.accounts().then((r) => r.data.data),
  })
}

export function useGeneralLedger(account: string, contact: string) {
  return useQuery({
    queryKey: ledgerKeys.generalLedger(account, contact),
    queryFn: () =>
      ledgerApi
        .generalLedger(contact ? { contact } : { account })
        .then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useJournals(filters: JournalFilters) {
  return useQuery({
    queryKey: ledgerKeys.journals(filters),
    queryFn: () => ledgerApi.journals(filters).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: ledgerKeys.journal(id),
    queryFn: () => ledgerApi.journal(id).then((r) => r.data.data),
  })
}

export function useJournalTemplates() {
  return useQuery({
    queryKey: ledgerKeys.templates(),
    queryFn: () => ledgerApi.templates().then((r) => r.data.data),
  })
}

export function useRecurringJournals() {
  return useQuery({
    queryKey: ledgerKeys.recurring(),
    queryFn: () => ledgerApi.recurring().then((r) => r.data.data),
  })
}

export function useOpeningBalances() {
  return useQuery({
    queryKey: ledgerKeys.openings(),
    queryFn: () => ledgerApi.openingBalances().then((r) => r.data.data),
  })
}

export function useCurrencies() {
  return useQuery({
    queryKey: ledgerKeys.currencies(),
    queryFn: () => ledgerApi.currencies().then((r) => r.data.data),
  })
}

export function useFxRevaluation() {
  return useQuery({
    queryKey: ledgerKeys.fxRevaluation(),
    queryFn: () => ledgerApi.fxRevaluation().then((r) => r.data.data),
  })
}
