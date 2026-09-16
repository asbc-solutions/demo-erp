"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { approvalsApi } from "../api/approvals"
import { coreHrKeys } from "../constants/query-keys"
import type {
  ApprovalApprovePayload,
  ApprovalDelegatePayload,
  ApprovalRejectPayload,
  ApprovalReturnPayload,
  SubmitApprovalRequestPayload,
} from "../types"

function invalidateApprovalQueries(
  qc: ReturnType<typeof useQueryClient>,
  id?: string
) {
  if (id) {
    qc.invalidateQueries({ queryKey: coreHrKeys.approvals.detail(id) })
  }
  qc.invalidateQueries({ queryKey: coreHrKeys.approvals.all })
}

export function useSubmitApprovalRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitApprovalRequestPayload) =>
      approvalsApi.submit(payload).then((r) => r.data.data),
    onSuccess: () => invalidateApprovalQueries(qc),
  })
}

export function useApproveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload?: ApprovalApprovePayload
    }) => approvalsApi.approve(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateApprovalQueries(qc, id),
  })
}

export function useRejectRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ApprovalRejectPayload
    }) => approvalsApi.reject(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateApprovalQueries(qc, id),
  })
}

export function useReturnRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ApprovalReturnPayload
    }) => approvalsApi.returnRequest(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateApprovalQueries(qc, id),
  })
}

export function useDelegateRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ApprovalDelegatePayload
    }) => approvalsApi.delegate(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => invalidateApprovalQueries(qc, id),
  })
}
