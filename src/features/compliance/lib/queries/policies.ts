"use client"

import { useQuery } from "@tanstack/react-query"

import { compliancePoliciesApi } from "../api/policies"
import { complianceKeys } from "../constants/query-keys"
import type { PoliciesListParams } from "../types/policies"

export function usePolicies(params?: PoliciesListParams) {
  return useQuery({
    queryKey: complianceKeys.policies.list(params),
    queryFn: () => compliancePoliciesApi.list(params).then((r) => r.data),
  })
}
