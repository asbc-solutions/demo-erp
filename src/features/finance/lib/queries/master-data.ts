"use client"

import { useQuery } from "@tanstack/react-query"

import { masterDataApi } from "../api/master-data"
import { financeKeys } from "../constants/query-keys"
import type { ContactKind } from "../types/common"

export function useFinanceContacts(kind?: ContactKind) {
  return useQuery({
    queryKey: financeKeys.masterData.contacts(kind),
    queryFn: () => masterDataApi.contacts(kind).then((r) => r.data.data),
  })
}

/** Accounts an entry can post to (no group accounts). */
export function useFinanceAccounts() {
  return useQuery({
    queryKey: financeKeys.masterData.accounts(),
    queryFn: () => masterDataApi.accounts().then((r) => r.data.data),
  })
}

export function useFinanceTreasuries() {
  return useQuery({
    queryKey: financeKeys.masterData.treasuries(),
    queryFn: () => masterDataApi.treasuries().then((r) => r.data.data),
  })
}
