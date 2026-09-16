"use client"

import { useQuery } from "@tanstack/react-query"
import type { ApiError } from "@/src/shared/lib/types/api"
import {
  leaveBalancesApi,
  leavePoliciesApi,
  leaveRequestsApi,
  leaveTypesApi,
} from "../api/leave"
import { coreHrKeys } from "../constants/query-keys"
import type {
  LeaveRequest,
  LeaveBalanceParams,
  LeavePolicyListParams,
  LeaveTypeListParams,
  MyLeaveRequestsParams,
  PendingLeaveRequestsParams,
} from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

function isNotFoundError(error: unknown) {
  const code = (error as Partial<ApiError>)?.code
  return code === "NOT_FOUND" || code === "404"
}

function emptyLeaveRequestsPage(params?: MyLeaveRequestsParams) {
  return {
    success: true,
    data: [] as LeaveRequest[],
    meta: {
      current_page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
      total: 0,
      last_page: 1,
    },
  }
}

// ─── Leave Types ──────────────────────────────────────────────────────────────

export function useLeaveTypes(params?: LeaveTypeListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: coreHrKeys.leaveTypes.list(params),
    queryFn: () => leaveTypesApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useLeaveType(id: string) {
  return useQuery({
    queryKey: coreHrKeys.leaveTypes.detail(id),
    queryFn: () => leaveTypesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

// ─── Leave Policies ─────────────────────────────────────────────────────────

export function useLeavePolicies(params?: LeavePolicyListParams) {
  return useQuery({
    queryKey: coreHrKeys.leavePolicies.list(params),
    queryFn: () => leavePoliciesApi.list(params).then((r) => r.data),
  })
}

// ─── Leave Balances ─────────────────────────────────────────────────────────

export function useMyLeaveBalances(params?: LeaveBalanceParams) {
  return useQuery({
    queryKey: coreHrKeys.leaveBalances.me(params?.year),
    queryFn: () => leaveBalancesApi.me(params).then((r) => r.data.data),
    retry: (failureCount, error) =>
      !isNotFoundError(error) && failureCount < 3,
  })
}

export function useEmployeeLeaveBalances(
  employeeId: string,
  params?: LeaveBalanceParams
) {
  return useQuery({
    queryKey: coreHrKeys.leaveBalances.byEmployee(employeeId, params?.year),
    queryFn: () =>
      leaveBalancesApi.byEmployee(employeeId, params).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}

// ─── Leave Requests ─────────────────────────────────────────────────────────

export function useMyLeaveRequests(
  params?: MyLeaveRequestsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: coreHrKeys.leaveRequests.mine(params),
    queryFn: async () => {
      try {
        const response = await leaveRequestsApi.mine(params)
        return response.data
      } catch (error) {
        if (isNotFoundError(error)) return emptyLeaveRequestsPage(params)
        throw error
      }
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) =>
      !isNotFoundError(error) && failureCount < 3,
  })
}

export function usePendingLeaveRequests(params?: PendingLeaveRequestsParams) {
  return useQuery({
    queryKey: coreHrKeys.leaveRequests.pending(params),
    queryFn: () => leaveRequestsApi.pending(params).then((r) => r.data),
  })
}

export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: coreHrKeys.leaveRequests.detail(id),
    queryFn: () => leaveRequestsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
