"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { financeKeys } from "../../../lib/constants/query-keys"
import { assistantApi, overviewApi } from "../api/overview"
import { overviewKeys } from "../constants/query-keys"
import type { AskPayload, AssistantSettingsPayload } from "../types/assistant"

/** Approving or sending back moves a bill out of the queue and changes nav badges. */
export function useApproveBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => overviewApi.approveBill(id).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

export function useSendBackBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      overviewApi.sendBackBill(id, reason).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

export function useAskAssistant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AskPayload) => assistantApi.ask(payload).then((r) => r.data.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: overviewKeys.assistant.history() }),
  })
}

export function useUpdateAssistantSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssistantSettingsPayload) =>
      assistantApi.updateSettings(payload).then((r) => r.data.data),
    onSuccess: (settings) =>
      queryClient.setQueryData(overviewKeys.assistant.settings(), settings),
  })
}
