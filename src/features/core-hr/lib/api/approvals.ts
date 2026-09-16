import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  ApprovalApprovePayload,
  ApprovalDelegatePayload,
  ApprovalListParams,
  ApprovalRejectPayload,
  ApprovalRequestDetail,
  ApprovalRequestSummary,
  ApprovalReturnPayload,
  SubmitApprovalRequestPayload,
} from "../types"

export const approvalsApi = {
  list: (params?: ApprovalListParams) =>
    httpClient.get<
      ApiResponse<ApprovalRequestSummary[]> & { meta: PaginationMeta }
    >("/approvals/requests", { params }),

  pendingForMe: () =>
    httpClient.get<ApiResponse<ApprovalRequestSummary[]>>(
      "/approvals/pending/me"
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<ApprovalRequestDetail>>(
      `/approvals/requests/${id}`
    ),

  submit: (payload: SubmitApprovalRequestPayload) =>
    httpClient.post<ApiResponse<ApprovalRequestDetail>>(
      "/approvals/requests",
      payload
    ),

  approve: (id: string, payload?: ApprovalApprovePayload) =>
    httpClient.post<ApiResponse<ApprovalRequestDetail>>(
      `/approvals/requests/${id}/approve`,
      payload
    ),

  reject: (id: string, payload: ApprovalRejectPayload) =>
    httpClient.post<ApiResponse<ApprovalRequestDetail>>(
      `/approvals/requests/${id}/reject`,
      payload
    ),

  returnRequest: (id: string, payload: ApprovalReturnPayload) =>
    httpClient.post<ApiResponse<ApprovalRequestDetail>>(
      `/approvals/requests/${id}/return`,
      payload
    ),

  delegate: (id: string, payload: ApprovalDelegatePayload) =>
    httpClient.post<ApiResponse<ApprovalRequestDetail>>(
      `/approvals/requests/${id}/delegate`,
      payload
    ),
}
