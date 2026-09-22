"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { planningApi } from "../api/planning"
import type { AllocationRuleInput, NewBudgetInput, NewCostCenterInput, NewDimensionInput } from "../types/planning"

export function useCreateBudget() {
  return useFinanceMutation((input: NewBudgetInput) => planningApi.createBudget(input).then(unwrap))
}

export function useSaveBudgetLines() {
  return useFinanceMutation(({ id, lines }: { id: string; lines: { cost_center_id: string; annual: number }[] }) =>
    planningApi.saveBudgetLines(id, lines).then(unwrap),
  )
}

export function useApproveBudget() {
  return useFinanceMutation((id: string) => planningApi.approveBudget(id).then(unwrap))
}

export function useLockBudget() {
  return useFinanceMutation((id: string) => planningApi.lockBudget(id).then(unwrap))
}

export function useCreateCostCenter() {
  return useFinanceMutation((input: NewCostCenterInput) => planningApi.createCostCenter(input).then(unwrap))
}

export function useCreateDimension() {
  return useFinanceMutation((input: NewDimensionInput) => planningApi.createDimension(input).then(unwrap))
}

export function useSaveAllocationRule() {
  return useFinanceMutation(({ id, input }: { id: string | null; input: AllocationRuleInput }) =>
    (id ? planningApi.updateRule(id, input) : planningApi.createRule(input)).then(unwrap),
  )
}

export function useToggleAllocationRule() {
  return useFinanceMutation((id: string) => planningApi.toggleRule(id).then(unwrap))
}

export function useRunAllocation() {
  return useFinanceMutation(() => planningApi.runAllocation().then(unwrap))
}
