"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { complianceRulesApi } from "../api/rules"
import { complianceKeys } from "../constants/query-keys"
import type { UpdateRulePayload } from "../types/rules"

export function useUpdateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRulePayload }) =>
      complianceRulesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complianceKeys.rules.all })
      // Score and alerts are derived live from rule status — refresh Overview too.
      qc.invalidateQueries({ queryKey: complianceKeys.overview.all })
    },
  })
}
