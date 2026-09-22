import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  AllocationRule,
  AllocationRuleInput,
  AllocationRuleList,
  AllocationRun,
  Budget,
  BudgetList,
  CostCenter,
  CostCenterDetail,
  CostCenterList,
  Dimension,
  DimensionList,
  NewBudgetInput,
  NewCostCenterInput,
  NewDimensionInput,
} from "../types/planning"

export const planningApi = {
  budgets: () => httpClient.get<ApiResponse<BudgetList>>("/finance/budgets"),

  budget: (id: string) => httpClient.get<ApiResponse<Budget | null>>(`/finance/budgets/${id}`),

  createBudget: (input: NewBudgetInput) => httpClient.post<ApiResponse<Budget>>("/finance/budgets", input),

  saveBudgetLines: (id: string, lines: { cost_center_id: string; annual: number }[]) =>
    httpClient.post<ApiResponse<Budget>>(`/finance/budgets/${id}/lines`, { lines }),

  approveBudget: (id: string) => httpClient.post<ApiResponse<Budget>>(`/finance/budgets/${id}/approve`),

  lockBudget: (id: string) => httpClient.post<ApiResponse<Budget>>(`/finance/budgets/${id}/lock`),

  costCenters: () => httpClient.get<ApiResponse<CostCenterList>>("/finance/cost-centers"),

  costCenter: (id: string) => httpClient.get<ApiResponse<CostCenterDetail | null>>(`/finance/cost-centers/${id}`),

  createCostCenter: (input: NewCostCenterInput) => httpClient.post<ApiResponse<CostCenter>>("/finance/cost-centers", input),

  dimensions: () => httpClient.get<ApiResponse<DimensionList>>("/finance/dimensions"),

  createDimension: (input: NewDimensionInput) => httpClient.post<ApiResponse<Dimension>>("/finance/dimensions", input),

  allocationRules: () => httpClient.get<ApiResponse<AllocationRuleList>>("/finance/allocation-rules"),

  createRule: (input: AllocationRuleInput) => httpClient.post<ApiResponse<AllocationRule>>("/finance/allocation-rules", input),

  updateRule: (id: string, input: AllocationRuleInput) => httpClient.post<ApiResponse<AllocationRule>>(`/finance/allocation-rules/${id}`, input),

  toggleRule: (id: string) => httpClient.post<ApiResponse<AllocationRule>>(`/finance/allocation-rules/${id}/toggle`),

  runAllocation: () => httpClient.post<ApiResponse<AllocationRun>>("/finance/allocation-rules/run"),
}
