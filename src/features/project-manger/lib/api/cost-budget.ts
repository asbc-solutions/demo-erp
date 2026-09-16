import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  ActualCost,
  Budget,
  BudgetDashboard,
  BudgetScopeParams,
  Commitment,
  CostMixResponse,
  CostPlan,
  CreateBudgetPayload,
  CreateCommitmentPayload,
  CreateCostPlanPayload,
  EvmMetrics,
  NodeCost,
  PostActualCostPayload,
  WaterfallResponse,
} from "../types"

export const costBudgetApi = {
  // ─── Budgets (project-scoped) ─────────────────────────────────────────────
  listBudgets: (projectId: string) =>
    httpClient.get<ApiResponse<Budget[]>>(`/pm/projects/${projectId}/budgets`),
  createBudget: (projectId: string, payload: CreateBudgetPayload) =>
    httpClient.post<ApiResponse<Budget>>(
      `/pm/projects/${projectId}/budgets`,
      payload,
    ),
  releaseBudget: (budgetId: string) =>
    httpClient.post<ApiResponse<{ budget: Budget; message: string }>>(
      `/pm/budgets/${budgetId}/release`,
    ),

  // ─── Cost plans (node-scoped) ─────────────────────────────────────────────
  listCostPlans: (nodeId: string) =>
    httpClient.get<ApiResponse<CostPlan[]>>(`/pm/nodes/${nodeId}/cost-plans`),
  createCostPlan: (nodeId: string, payload: CreateCostPlanPayload) =>
    httpClient.post<ApiResponse<CostPlan>>(
      `/pm/nodes/${nodeId}/cost-plans`,
      payload,
    ),

  // ─── Commitments (node-scoped) ────────────────────────────────────────────
  listCommitments: (nodeId: string) =>
    httpClient.get<ApiResponse<Commitment[]>>(
      `/pm/nodes/${nodeId}/commitments`,
    ),
  createCommitment: (nodeId: string, payload: CreateCommitmentPayload) =>
    httpClient.post<ApiResponse<Commitment>>(
      `/pm/nodes/${nodeId}/commitments`,
      payload,
    ),

  // ─── Actual costs (node-scoped) ───────────────────────────────────────────
  postActualCost: (nodeId: string, payload: PostActualCostPayload) =>
    httpClient.post<ApiResponse<ActualCost>>(
      `/pm/nodes/${nodeId}/actual-costs`,
      payload,
    ),

  // ─── Roll-ups ─────────────────────────────────────────────────────────────
  getNodeCost: (nodeId: string) =>
    httpClient.get<ApiResponse<NodeCost>>(`/pm/nodes/${nodeId}/cost`),
  getEvm: (projectId: string) =>
    httpClient.get<ApiResponse<EvmMetrics>>(`/pm/projects/${projectId}/evm`),

  // ─── Portfolio dashboard / charts (omit project_id → portfolio-wide) ──────
  getDashboard: (params?: BudgetScopeParams) =>
    httpClient.get<ApiResponse<BudgetDashboard>>("/pm/costbudget/dashboard", {
      params,
    }),
  getCostMix: (params?: BudgetScopeParams) =>
    httpClient.get<ApiResponse<CostMixResponse>>("/pm/costbudget/cost-mix", {
      params,
    }),
  getWaterfall: (params?: BudgetScopeParams) =>
    httpClient.get<ApiResponse<WaterfallResponse>>("/pm/costbudget/waterfall", {
      params,
    }),
}
