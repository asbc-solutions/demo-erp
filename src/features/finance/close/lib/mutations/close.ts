"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { closeApi } from "../api/close"

export function useSetTaskStatus() {
  return useFinanceMutation(({ id, status }: { id: string; status: string }) => closeApi.setTaskStatus(id, status).then(unwrap))
}

export function useClosePeriod() {
  return useFinanceMutation((id: string) => closeApi.closePeriod(id).then(unwrap))
}

export function useReopenPeriod() {
  return useFinanceMutation(({ id, reason }: { id: string; reason: string }) => closeApi.reopenPeriod(id, reason).then(unwrap))
}

export function useCompleteYearEndStep() {
  return useFinanceMutation((id: string) => closeApi.completeStep(id).then(unwrap))
}

export function useLockYear() {
  return useFinanceMutation(() => closeApi.lockYear().then(unwrap))
}
