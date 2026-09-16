"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { billingApi } from "../api/billing"
import { settingsKeys } from "../constants/query-keys"
import type { ChangePlanPayload, SavePaymentMethodPayload } from "../types/billing"

export function useChangePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChangePlanPayload) =>
      billingApi.changePlan(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.billing.all }),
  })
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: (invoiceId: string) =>
      billingApi.downloadInvoice(invoiceId).then((r) => r.data.data.download_url),
  })
}

/**
 * Token-only — see `SavePaymentMethodPayload` docs. Real usage requires a
 * payment-provider SDK to tokenize the card client-side first; that's out of
 * scope here, so this mutation is wired but not yet called with a real token
 * anywhere in the UI (see TODO in `billing-tab.tsx`).
 */
export function useSavePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SavePaymentMethodPayload) =>
      billingApi.savePaymentMethod(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.billing.all }),
  })
}
