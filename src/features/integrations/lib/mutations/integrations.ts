"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { integrationsApi } from "../api/integrations"
import { integrationsKeys } from "../constants/query-keys"
import type {
  ConnectIntegrationPayload,
  IntegrationProvider,
  RecordSyncPayload,
} from "../types/integration"

export function useConnectIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      provider,
      payload,
    }: {
      provider: IntegrationProvider
      payload?: ConnectIntegrationPayload
    }) => integrationsApi.connect(provider, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.all }),
  })
}

export function useDisconnectIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: IntegrationProvider) =>
      integrationsApi.disconnect(provider).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.all }),
  })
}

export function useRecordSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      provider,
      payload,
    }: {
      provider: IntegrationProvider
      payload?: RecordSyncPayload
    }) => integrationsApi.recordSync(provider, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.all }),
  })
}
