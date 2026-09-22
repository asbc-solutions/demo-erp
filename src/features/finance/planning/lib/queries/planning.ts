"use client"

import { useQuery } from "@tanstack/react-query"

import { planningApi } from "../api/planning"
import { planningKeys } from "../constants/query-keys"

export function useBudgets() {
  return useQuery({ queryKey: planningKeys.budgets(), queryFn: () => planningApi.budgets().then((r) => r.data.data) })
}

export function useBudget(id: string) {
  return useQuery({ queryKey: planningKeys.budget(id), queryFn: () => planningApi.budget(id).then((r) => r.data.data ?? null) })
}

export function useCostCenters() {
  return useQuery({ queryKey: planningKeys.costCenters(), queryFn: () => planningApi.costCenters().then((r) => r.data.data) })
}

export function useCostCenter(id: string) {
  return useQuery({ queryKey: planningKeys.costCenter(id), queryFn: () => planningApi.costCenter(id).then((r) => r.data.data ?? null) })
}

export function useDimensions() {
  return useQuery({ queryKey: planningKeys.dimensions(), queryFn: () => planningApi.dimensions().then((r) => r.data.data) })
}

export function useAllocationRules() {
  return useQuery({ queryKey: planningKeys.allocationRules(), queryFn: () => planningApi.allocationRules().then((r) => r.data.data) })
}
