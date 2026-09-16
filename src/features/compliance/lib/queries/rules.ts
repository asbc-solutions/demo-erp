"use client"

import { useQuery } from "@tanstack/react-query"

import { complianceRulesApi } from "../api/rules"
import { complianceKeys } from "../constants/query-keys"
import type { RulesListParams } from "../types/rules"

export function useComplianceRules(params?: RulesListParams) {
  return useQuery({
    queryKey: complianceKeys.rules.list(params),
    queryFn: () => complianceRulesApi.list(params).then((r) => r.data),
  })
}

/** Configurable list from the backend — never hardcode framework codes client-side. */
export function useComplianceFrameworks() {
  return useQuery({
    queryKey: complianceKeys.rules.frameworks(),
    queryFn: () => complianceRulesApi.listFrameworks().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}
