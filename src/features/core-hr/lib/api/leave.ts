import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  CreateLeavePolicyPayload,
  CreateLeaveTypePayload,
  LeaveAdjustmentPayload,
  LeaveBalance,
  LeaveBalanceParams,
  LeavePolicy,
  LeavePolicyListParams,
  LeaveRequest,
  LeaveType,
  LeaveTypeListParams,
  MedicalCertificateDownload,
  MedicalCertificateUploadResult,
  MyLeaveRequestsParams,
  PendingLeaveRequestsParams,
  SubmitLeaveRequestPayload,
  UpdateLeaveTypePayload,
} from "../types"

type Paginated<T> = Omit<ApiResponse<T>, "meta"> & { meta: PaginationMeta }

// ─── Leave Types ──────────────────────────────────────────────────────────────

export const leaveTypesApi = {
  list: (params?: LeaveTypeListParams) =>
    httpClient.get<Paginated<LeaveType[]>>("/leave-types", { params }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<LeaveType>>(`/leave-types/${id}`),

  create: (payload: CreateLeaveTypePayload) =>
    httpClient.post<ApiResponse<LeaveType>>("/leave-types", payload),

  update: (id: string, payload: UpdateLeaveTypePayload) =>
    httpClient.put<ApiResponse<LeaveType>>(`/leave-types/${id}`, payload),
}

// ─── Leave Policies ─────────────────────────────────────────────────────────

export const leavePoliciesApi = {
  list: (params?: LeavePolicyListParams) =>
    httpClient.get<Paginated<LeavePolicy[]>>("/leave-policies", { params }),

  create: (payload: CreateLeavePolicyPayload) =>
    httpClient.post<ApiResponse<LeavePolicy>>("/leave-policies", payload),
}

// ─── Leave Balances ─────────────────────────────────────────────────────────

export const leaveBalancesApi = {
  me: (params?: LeaveBalanceParams) =>
    httpClient.get<ApiResponse<LeaveBalance[]>>("/leave/balances/me", {
      params,
    }),

  byEmployee: (employeeId: string, params?: LeaveBalanceParams) =>
    httpClient.get<ApiResponse<LeaveBalance[]>>(
      `/employees/${employeeId}/leave-balances`,
      { params }
    ),

  adjust: (payload: LeaveAdjustmentPayload) =>
    httpClient.post<ApiResponse<{ adjusted: boolean }>>(
      "/leave/adjustments",
      payload
    ),
}

// ─── Leave Requests ─────────────────────────────────────────────────────────

export const leaveRequestsApi = {
  mine: (params?: MyLeaveRequestsParams) =>
    httpClient.get<Paginated<LeaveRequest[]>>("/leave/requests/me", { params }),

  pending: (params?: PendingLeaveRequestsParams) =>
    httpClient.get<Paginated<LeaveRequest[]>>("/leave/requests/pending", {
      params,
    }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<LeaveRequest>>(`/leave/requests/${id}`),

  submit: (payload: SubmitLeaveRequestPayload) =>
    httpClient.post<ApiResponse<LeaveRequest>>("/leave/requests", payload),

  cancel: (id: string) =>
    httpClient.post<ApiResponse<LeaveRequest>>(
      `/leave/requests/${id}/cancel`,
      {}
    ),

  uploadCertificate: (id: string, file: File) => {
    const form = new FormData()
    form.append("certificate", file)
    return httpClient.post<ApiResponse<MedicalCertificateUploadResult>>(
      `/leave/requests/${id}/certificate`,
      form,
      { headers: { "Content-Type": undefined } }
    )
  },

  downloadCertificate: (id: string) =>
    httpClient.get<ApiResponse<MedicalCertificateDownload>>(
      `/leave/requests/${id}/certificate`
    ),
}
