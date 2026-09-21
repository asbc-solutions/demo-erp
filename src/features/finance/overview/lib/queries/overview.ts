"use client"

import { useQuery } from "@tanstack/react-query"

import { assistantApi, overviewApi } from "../api/overview"
import { overviewKeys } from "../constants/query-keys"

export function useFinanceHome() {
  return useQuery({
    queryKey: overviewKeys.home(),
    queryFn: () => overviewApi.home().then((r) => r.data.data),
  })
}

export function useCashPosition() {
  return useQuery({
    queryKey: overviewKeys.cashPosition(),
    queryFn: () => overviewApi.cashPosition().then((r) => r.data.data),
  })
}

export function useCloseReadiness(enabled = true) {
  return useQuery({
    queryKey: overviewKeys.closeReadiness(),
    queryFn: () => overviewApi.closeReadiness().then((r) => r.data.data),
    enabled,
  })
}

export function useFinanceExceptions(enabled = true) {
  return useQuery({
    queryKey: overviewKeys.exceptions(),
    queryFn: () => overviewApi.exceptions().then((r) => r.data.data),
    enabled,
  })
}

export function usePendingBills() {
  return useQuery({
    queryKey: overviewKeys.pendingBills(),
    queryFn: () => overviewApi.pendingBills().then((r) => r.data.data),
  })
}

export function useAssistantSettings() {
  return useQuery({
    queryKey: overviewKeys.assistant.settings(),
    queryFn: () => assistantApi.settings().then((r) => r.data.data),
  })
}

export function useAssistantBriefing(enabled = true) {
  return useQuery({
    queryKey: overviewKeys.assistant.briefing(),
    queryFn: () => assistantApi.briefing().then((r) => r.data.data),
    enabled,
  })
}

export function useAssistantDrafts(status: string, enabled = true) {
  return useQuery({
    queryKey: overviewKeys.assistant.drafts(status),
    queryFn: () => assistantApi.drafts(status).then((r) => r.data.data),
    enabled,
  })
}

export function useAssistantHistory(enabled = true) {
  return useQuery({
    queryKey: overviewKeys.assistant.history(),
    queryFn: () => assistantApi.history().then((r) => r.data.data),
    enabled,
  })
}
