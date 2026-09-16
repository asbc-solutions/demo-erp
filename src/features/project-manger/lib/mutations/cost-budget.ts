"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { costBudgetApi } from "../api/cost-budget"
import { pmKeys } from "../constants/query-keys"
import type {
  CreateBudgetPayload,
  CreateCommitmentPayload,
  CreateCostPlanPayload,
  PostActualCostPayload,
} from "../types"

export function useCreateBudget(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) =>
      costBudgetApi.createBudget(projectId, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.budgets(projectId) }),
  })
}

export function useReleaseBudget(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (budgetId: string) =>
      costBudgetApi.releaseBudget(budgetId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.budgets(projectId) }),
  })
}

export function useCreateCostPlan(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCostPlanPayload) =>
      costBudgetApi.createCostPlan(nodeId, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.costPlans(nodeId) })
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.nodeCost(nodeId) })
    },
  })
}

export function useCreateCommitment(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCommitmentPayload) =>
      costBudgetApi.createCommitment(nodeId, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.commitments(nodeId) })
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.nodeCost(nodeId) })
    },
  })
}

export function usePostActualCost(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PostActualCostPayload) =>
      costBudgetApi.postActualCost(nodeId, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.costBudget.nodeCost(nodeId) }),
  })
}
