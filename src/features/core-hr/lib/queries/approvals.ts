"use client"

import { useQuery } from "@tanstack/react-query"
import { approvalsApi } from "../api/approvals"
import { coreHrKeys } from "../constants/query-keys"
import type { ApprovalListParams } from "../types"

export function useApprovals(params?: ApprovalListParams) {
  return useQuery({
    queryKey: coreHrKeys.approvals.list(params),
    queryFn: () => approvalsApi.list(params).then((r) => r.data),
  })
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: coreHrKeys.approvals.detail(id),
    queryFn: () => approvalsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function usePendingApprovalsForMe() {
  return useQuery({
    queryKey: coreHrKeys.approvals.pendingForMe(),
    queryFn: () => approvalsApi.pendingForMe().then((r) => r.data.data),
  })
}
