"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { discountApprovalsApi } from "../api/discount-approvals"
import { salesKeys } from "../constants/query-keys"
import type { DecideDiscountApprovalPayload, RequestDiscountApprovalPayload } from "../types"

export function useRequestDiscountApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      quotationId,
      lineId,
      payload,
    }: {
      quotationId: string
      lineId: string
      payload: RequestDiscountApprovalPayload
    }) =>
      discountApprovalsApi.request(quotationId, lineId, payload).then((r) => r.data.data),
    onSuccess: (_, { quotationId }) => {
      qc.invalidateQueries({ queryKey: salesKeys.quotations.detail(quotationId) })
    },
  })
}

export function useDecideDiscountApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      approvalId,
      payload,
    }: {
      approvalId: string
      payload: DecideDiscountApprovalPayload
    }) => discountApprovalsApi.decide(approvalId, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.quotations.all }),
  })
}
