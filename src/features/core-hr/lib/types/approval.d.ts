export type ApprovalApiStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"

export type ApprovalApiRequestType =
  | "transfer"
  | "promotion"
  | "termination"
  | "salary_change"
  | "general"

export type ApprovalStepStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "delegated"

export type ApprovalListParams = {
  page?: number
  per_page?: number
  status?: ApprovalApiStatus
  request_type?: ApprovalApiRequestType
  requested_by?: number
}

export type ApprovalStepHistoryItem = {
  step_number: number
  approver_role?: string | null
  approver_user_id?: number | null
  status: ApprovalStepStatus
  status_label: string
  decision_date: string | null
  decision_notes?: string | null
  delegated_to?: number | null
}

export type ApprovalRequestSummary = {
  id: string
  request_type: ApprovalApiRequestType
  request_type_label: string
  target_id: string | null
  current_step: number
  total_steps: number
  status: ApprovalApiStatus
  status_label: string
  requested_by: number
  requested_at: string
  completed_at: string | null
}

export type ApprovalRequestDetail = ApprovalRequestSummary & {
  context_data?: Record<string, unknown> | null
  notes?: string | null
  step_history?: ApprovalStepHistoryItem[]
  created_at?: string
  updated_at?: string
}

export type SubmitApprovalRequestPayload = {
  request_type: ApprovalApiRequestType
  target_id?: string | null
  context_data?: Record<string, unknown> | null
  notes?: string | null
}

export type ApprovalApprovePayload = {
  notes?: string
}

export type ApprovalRejectPayload = {
  reason: string
}

export type ApprovalReturnPayload = {
  reason: string
}

export type ApprovalDelegatePayload = {
  delegate_to_user_id: number
  notes?: string
}
