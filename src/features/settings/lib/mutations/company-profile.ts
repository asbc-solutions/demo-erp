"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { companyProfileApi } from "../api/company-profile"
import { settingsKeys } from "../constants/query-keys"
import type { UpdateCompanyProfilePayload } from "../types/company-profile"

export function useUpdateCompanyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCompanyProfilePayload) =>
      companyProfileApi.update(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.companyProfile.all }),
  })
}

/**
 * Destructive — wipes and reseeds the whole database and invalidates every
 * session, including the caller's. Callers MUST gate this behind an explicit
 * confirmation step (see `ResetDemoDataDialog`) and should sign the user out
 * on success since their own session no longer exists server-side.
 */
export function useResetDemoData() {
  return useMutation({
    mutationFn: () =>
      companyProfileApi.resetDemoData({ confirm: true }).then((r) => r.data.data),
  })
}
