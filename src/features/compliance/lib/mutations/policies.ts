"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { compliancePoliciesApi } from "../api/policies"
import { complianceKeys } from "../constants/query-keys"
import type { CreatePolicyPayload } from "../types/policies"

export function useCreatePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePolicyPayload) =>
      compliancePoliciesApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: complianceKeys.policies.all }),
  })
}

/** Idempotent on the backend; invalidate so the ack counter/ratio refreshes. */
export function useAcknowledgePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => compliancePoliciesApi.acknowledge(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: complianceKeys.policies.all }),
  })
}
