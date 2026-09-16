"use client"

import { useQuery } from "@tanstack/react-query"
import { billingApi } from "../api/billing"
import { pmKeys } from "../constants/query-keys"

/** Active billing plan. Returns `null` when the project has none (404). */
export function useBillingPlan(projectId: string) {
  return useQuery({
    queryKey: pmKeys.billing.plan(projectId),
    queryFn: () =>
      billingApi
        .getPlan(projectId)
        .then((r) => r.data.data)
        .catch(() => null),
    enabled: !!projectId,
    retry: false,
  })
}

export function useRevenueSummary(projectId: string) {
  return useQuery({
    queryKey: pmKeys.billing.revenue(projectId),
    queryFn: () => billingApi.revenueSummary(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useBillingMilestones(projectId: string) {
  return useQuery({
    queryKey: pmKeys.billing.milestones(projectId),
    queryFn: () => billingApi.listMilestones(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useInvoices(projectId: string) {
  return useQuery({
    queryKey: pmKeys.billing.invoices(projectId),
    queryFn: () => billingApi.listInvoices(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

/* ── Portfolio (all projects at once) ────────────────────────────────── */

export function usePortfolioRevenueSummary(enabled = true) {
  return useQuery({
    queryKey: pmKeys.billing.portfolioRevenue(),
    queryFn: () =>
      billingApi.portfolioRevenueSummary().then((r) => r.data.data),
    enabled,
  })
}

export function usePortfolioBillingMilestones(enabled = true) {
  return useQuery({
    queryKey: pmKeys.billing.portfolioMilestones(),
    queryFn: () => billingApi.listAllMilestones().then((r) => r.data.data),
    enabled,
  })
}

export function usePortfolioInvoices(enabled = true) {
  return useQuery({
    queryKey: pmKeys.billing.portfolioInvoices(),
    queryFn: () => billingApi.listAllInvoices().then((r) => r.data.data),
    enabled,
  })
}
