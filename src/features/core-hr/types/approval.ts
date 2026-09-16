import type { AvatarTone } from "./employee"

export type ApprovalRequestType =
  | "TRANSFER"
  | "PROMOTION"
  | "LEAVE"
  | "SALARY_CHANGE"
  | "CONTRACT"
  | "TERMINATION"
  | "GENERAL"

export type ApprovalRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED"

export type ApprovalWorkflowStepVariant =
  | "complete"
  | "current"
  | "pending"
  | "rejected"
  | "returned"
  | "delegated"

export type ApprovalWorkflowStep = {
  id: string
  title: string
  assignee?: string
  completedAt?: string
  variant: ApprovalWorkflowStepVariant
}

export type ApprovalRequest = {
  id: string
  requestNumber: string
  type: ApprovalRequestType
  employeeName: string
  employeeNumber: string
  employeeAvatarTone: AvatarTone
  requestedBy: string
  dateSubmitted: string
  completedAt?: string | null
  detailsSummary: string
  status: ApprovalRequestStatus
  /** Detail sheet — longer subtitle under the title */
  detailHeadline?: string
  employeeRole?: string
  employeeDepartment?: string
  effectiveDate?: string
  reason?: string
  transferFromBranch?: string
  transferToBranch?: string
  transferToDepartment?: string
  promotionFromTitle?: string
  promotionToTitle?: string
  workflowSteps?: ApprovalWorkflowStep[]
  /** Shown in detail sheet when status is rejected */
  impactSummaryLines?: string[]
}

export type ApprovalStats = {
  pending: number
  approvedThisMonth: number
  rejectedThisMonth: number
  avgResponseHours: number
}
