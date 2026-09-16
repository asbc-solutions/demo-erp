"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  leaveBalancesApi,
  leavePoliciesApi,
  leaveRequestsApi,
  leaveTypesApi,
} from "../api/leave"
import { coreHrKeys } from "../constants/query-keys"
import type {
  CreateLeavePolicyPayload,
  CreateLeaveTypePayload,
  LeaveAdjustmentPayload,
  SubmitLeaveRequestPayload,
  UpdateLeaveTypePayload,
} from "../types"

// ─── Leave Types ──────────────────────────────────────────────────────────────

export function useCreateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeaveTypePayload) =>
      leaveTypesApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveTypes.all }),
  })
}

export function useUpdateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateLeaveTypePayload
    }) => leaveTypesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveTypes.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveTypes.detail(id) })
    },
  })
}

// ─── Leave Policies ─────────────────────────────────────────────────────────

export function useCreateLeavePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeavePolicyPayload) =>
      leavePoliciesApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.leavePolicies.all }),
  })
}

// ─── Leave Requests ─────────────────────────────────────────────────────────

export function useSubmitLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitLeaveRequestPayload) =>
      leaveRequestsApi.submit(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveRequests.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveBalances.all })
    },
  })
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      leaveRequestsApi.cancel(id).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveRequests.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveBalances.all })
    },
  })
}

export function useUploadMedicalCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      leaveRequestsApi.uploadCertificate(id, file).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveRequests.all }),
  })
}

// ─── Leave Balances ─────────────────────────────────────────────────────────

export function useAdjustLeaveBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LeaveAdjustmentPayload) =>
      leaveBalancesApi.adjust(payload).then((r) => r.data.data),
    onSuccess: (_, { employee_id, fiscal_year }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.leaveBalances.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.leaveBalances.byEmployee(employee_id, fiscal_year),
      })
    },
  })
}
