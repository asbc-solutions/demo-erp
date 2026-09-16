"use client"

import { useQuery } from "@tanstack/react-query"
import { costBudgetApi } from "../api/cost-budget"
import { pmKeys } from "../constants/query-keys"
import type { BudgetScopeParams } from "../types"

/** EVM + forecast dashboard. Omit `project_id` for a portfolio-wide roll-up. */
export function useBudgetDashboard(params?: BudgetScopeParams) {
  return useQuery({
    queryKey: pmKeys.costBudget.dashboard(params),
    queryFn: () => costBudgetApi.getDashboard(params).then((r) => r.data.data),
  })
}

/** Planned cost split by cost type. Omit `project_id` for portfolio-wide. */
export function useCostMix(params?: BudgetScopeParams) {
  return useQuery({
    queryKey: pmKeys.costBudget.costMix(params),
    queryFn: () => costBudgetApi.getCostMix(params).then((r) => r.data.data),
  })
}

/** Flat WBS planned/committed/actual rows. Omit `project_id` for portfolio. */
export function useWaterfall(params?: BudgetScopeParams) {
  return useQuery({
    queryKey: pmKeys.costBudget.waterfall(params),
    queryFn: () => costBudgetApi.getWaterfall(params).then((r) => r.data.data),
  })
}

export function useBudgets(projectId: string) {
  return useQuery({
    queryKey: pmKeys.costBudget.budgets(projectId),
    queryFn: () => costBudgetApi.listBudgets(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useEvm(projectId: string) {
  return useQuery({
    queryKey: pmKeys.costBudget.evm(projectId),
    queryFn: () => costBudgetApi.getEvm(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

export function useCostPlans(nodeId: string) {
  return useQuery({
    queryKey: pmKeys.costBudget.costPlans(nodeId),
    queryFn: () => costBudgetApi.listCostPlans(nodeId).then((r) => r.data.data),
    enabled: !!nodeId,
  })
}

export function useNodeCost(nodeId: string) {
  return useQuery({
    queryKey: pmKeys.costBudget.nodeCost(nodeId),
    queryFn: () => costBudgetApi.getNodeCost(nodeId).then((r) => r.data.data),
    enabled: !!nodeId,
  })
}

export function useCommitments(nodeId: string) {
  return useQuery({
    queryKey: pmKeys.costBudget.commitments(nodeId),
    queryFn: () =>
      costBudgetApi.listCommitments(nodeId).then((r) => r.data.data),
    enabled: !!nodeId,
  })
}
