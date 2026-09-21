"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { assistantApi } from "../api/overview"
import { overviewKeys } from "../constants/query-keys"
import type { AskPayload, AssistantSettingsPayload } from "../types/assistant"

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
