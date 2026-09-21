"use client"

import { useQuery } from "@tanstack/react-query"

import { bankingApi } from "../api/banking"
import { bankingKeys } from "../constants/query-keys"
import type { ChequeDirection } from "../types/banking"

export function useBankingOverview() {
  return useQuery({
    queryKey: bankingKeys.overview(),
    queryFn: () => bankingApi.overview().then((r) => r.data.data),
  })
}

export function useTreasuryDetail(id: string) {
  return useQuery({
    queryKey: bankingKeys.treasury(id),
    queryFn: () => bankingApi.treasury(id).then((r) => r.data.data),
  })
}

export function useReconciliation(treasuryId: string | undefined) {
  return useQuery({
    queryKey: bankingKeys.workspace(treasuryId ?? ""),
    queryFn: () => bankingApi.workspace(treasuryId ?? "").then((r) => r.data.data),
    enabled: Boolean(treasuryId),
  })
}

export function useLatestImport(treasuryId: string) {
  return useQuery({
    queryKey: bankingKeys.latestImport(treasuryId),
    queryFn: () => bankingApi.latestImport(treasuryId).then((r) => r.data.data),
    enabled: Boolean(treasuryId),
  })
}

export function useTransfers() {
  return useQuery({
    queryKey: bankingKeys.transfers(),
    queryFn: () => bankingApi.transfers().then((r) => r.data.data),
  })
}

export function useCheques(direction: ChequeDirection) {
  return useQuery({
    queryKey: bankingKeys.cheques(direction),
    queryFn: () => bankingApi.cheques(direction).then((r) => r.data.data),
  })
}

export function useCheque(id: string) {
  return useQuery({
    queryKey: bankingKeys.cheque(id),
    queryFn: () => bankingApi.cheque(id).then((r) => r.data.data),
  })
}

export function useChequeBooks() {
  return useQuery({
    queryKey: bankingKeys.chequeBooks(),
    queryFn: () => bankingApi.chequeBooks().then((r) => r.data.data),
  })
}

export function useEmployees() {
  return useQuery({
    queryKey: bankingKeys.employees(),
    queryFn: () => bankingApi.employees().then((r) => r.data.data),
  })
}

export function useCustody() {
  return useQuery({
    queryKey: bankingKeys.custody(),
    queryFn: () => bankingApi.custody().then((r) => r.data.data),
  })
}

export function useCustodyHolder(id: string) {
  return useQuery({
    queryKey: bankingKeys.custodyHolder(id),
    queryFn: () => bankingApi.custodyHolder(id).then((r) => r.data.data),
  })
}
