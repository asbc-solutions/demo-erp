import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  BillingMilestone,
  BillingPlan,
  Invoice,
  PortfolioBillingMilestone,
  PortfolioInvoice,
  PortfolioRevenueSummary,
  RevenueSummary,
} from "../types"

export const billingApi = {
  /** Active billing plan for a project. 404s when none is configured. */
  getPlan: (projectId: string) =>
    httpClient.get<ApiResponse<BillingPlan>>(
      `/pm/projects/${projectId}/billing-plan`,
    ),
  revenueSummary: (projectId: string) =>
    httpClient.get<ApiResponse<RevenueSummary>>(
      `/pm/projects/${projectId}/revenue-summary`,
    ),
  listMilestones: (projectId: string) =>
    httpClient.get<ApiResponse<BillingMilestone[]>>(`/pm/billing/milestones`, {
      params: { project_id: projectId },
    }),
  listInvoices: (projectId: string) =>
    httpClient.get<ApiResponse<Invoice[]>>(
      `/pm/projects/${projectId}/invoices`,
    ),

  // ─── Portfolio (all projects at once) ────────────────────────────────────
  portfolioRevenueSummary: () =>
    httpClient.get<ApiResponse<PortfolioRevenueSummary>>(
      "/pm/billing/revenue-summary",
    ),
  listAllMilestones: () =>
    httpClient.get<ApiResponse<PortfolioBillingMilestone[]>>(
      "/pm/billing/milestones",
    ),
  listAllInvoices: () =>
    httpClient.get<ApiResponse<PortfolioInvoice[]>>("/pm/invoices"),
}
