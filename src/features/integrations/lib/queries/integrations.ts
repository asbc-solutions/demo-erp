"use client"

import { useQuery } from "@tanstack/react-query"

import { integrationsApi } from "../api/integrations"
import { integrationsKeys } from "../constants/query-keys"

export function useIntegrations() {
  return useQuery({
    queryKey: integrationsKeys.list(),
    queryFn: () => integrationsApi.list().then((r) => r.data),
  })
}
