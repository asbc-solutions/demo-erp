"use client"

import { useQuery } from "@tanstack/react-query"

import { billingApi } from "../api/billing"
import { settingsKeys } from "../constants/query-keys"
import type { BillingInvoiceStatus } from "../types/billing"

export function useBillingOverview() {
  return useQuery({
    queryKey: settingsKeys.billing.overview(),
    queryFn: () => billingApi.overview().then((r) => r.data.data),
  })
}

export function useBillingInvoices(status?: BillingInvoiceStatus) {
  return useQuery({
    queryKey: settingsKeys.billing.invoices(status),
    queryFn: () => billingApi.invoices(status).then((r) => r.data.data),
  })
}
