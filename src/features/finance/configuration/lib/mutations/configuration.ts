"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { configurationApi } from "../api/configuration"
import type { NewPolicyInput, NewRoleInput, SetupInput, StageInput } from "../types/configuration"

export function useCompleteSetup() {
  return useFinanceMutation((input: SetupInput) => configurationApi.completeSetup(input).then(unwrap))
}

export function useStageRule() {
  return useFinanceMutation(({ id, input }: { id: string; input: StageInput }) => configurationApi.stageRule(id, input).then(unwrap))
}

export function useDiscardStaged() {
  return useFinanceMutation(() => configurationApi.discardStaged().then(unwrap))
}

export function usePublishMap() {
  return useFinanceMutation(() => configurationApi.publishMap().then(unwrap))
}

export function useSaveFiscalCalendar() {
  return useFinanceMutation((input: { year_start_month: number; adjusting_days: number }) => configurationApi.saveFiscalCalendar(input).then(unwrap))
}

export function useCreatePolicy() {
  return useFinanceMutation((input: NewPolicyInput) => configurationApi.createPolicy(input).then(unwrap))
}

export function useSetPersona() {
  return useFinanceMutation((persona: string) => configurationApi.setPersona(persona).then(unwrap))
}

export function useCreateRole() {
  return useFinanceMutation((input: NewRoleInput) => configurationApi.createRole(input).then(unwrap))
}
