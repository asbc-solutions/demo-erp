// ─── Leave Types ────────────────────────────────────────────────────────────

export type LeaveTypeCategory =
  | "annual"
  | "sick"
  | "maternity"
  | "paternity"
  | "unpaid"
  | "emergency"
  | "bereavement"
  | "compassionate"
  | "hajj"
  | "study"
  | "other"

export type LeaveType = {
  id: string
  code: string
  name: string
  name_ar: string
  category: LeaveTypeCategory
  is_paid: boolean
  requires_document: boolean
  affects_attendance: boolean
  color_hex: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type LeaveTypeListParams = {
  category?: LeaveTypeCategory
  is_active?: boolean
  search?: string
  page?: number
  per_page?: number
}

export type CreateLeaveTypePayload = {
  code: string
  name: string
  name_ar: string
  category: LeaveTypeCategory
  is_paid: boolean
  requires_document: boolean
  affects_attendance: boolean
  color_hex: string
  is_active?: boolean
}

export type UpdateLeaveTypePayload = Partial<Omit<CreateLeaveTypePayload, "code">>

// ─── Leave Policies ─────────────────────────────────────────────────────────

export type LeavePolicyScope = "all" | "grade" | "dept"
export type AccrualMethod = "annual_lump" | "monthly" | "anniversary" | "none"
export type GenderEligibility = "all" | "male" | "female"

export type LeavePolicy = {
  id: string
  leave_type_id: string
  /** Embedded leave type, when the API expands the relation. */
  leave_type?: LeaveType
  scope: LeavePolicyScope
  scope_id: string | null
  annual_entitlement_days: number
  accrual_method: AccrualMethod
  accrual_rate: number | null
  max_carry_forward_days: number | null
  min_service_months: number
  max_consecutive_days: number | null
  notice_days: number
  allow_negative_balance: boolean
  gender_eligibility: GenderEligibility
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type LeavePolicyListParams = {
  leave_type_id?: string
  scope?: LeavePolicyScope
  is_active?: boolean
  page?: number
  per_page?: number
}

export type CreateLeavePolicyPayload = {
  leave_type_id: string
  scope: LeavePolicyScope
  scope_id?: string | null
  annual_entitlement_days: number
  accrual_method: AccrualMethod
  accrual_rate?: number | null
  max_carry_forward_days?: number | null
  min_service_months?: number
  max_consecutive_days?: number | null
  notice_days?: number
  allow_negative_balance?: boolean
  gender_eligibility?: GenderEligibility
  is_active?: boolean
}

// ─── Leave Balances ─────────────────────────────────────────────────────────

export type LeaveBalance = {
  id: string
  employee_id: string
  leave_type_id: string
  /** Embedded leave type, when the API expands the relation. */
  leave_type?: LeaveType
  fiscal_year: number
  opening_balance: number
  accrued_ytd: number
  used_ytd: number
  pending_ytd: number
  available_balance: number
}

export type LeaveBalanceParams = {
  year?: number
}

export type LeaveAdjustmentPayload = {
  employee_id: string
  leave_type_id: string
  fiscal_year: number
  adjustment_days: number
  reason: string
}

// ─── Leave Requests ─────────────────────────────────────────────────────────

export type LeaveRequestStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"

export type HalfDayPeriod = "first_half" | "second_half"

/** Lightweight employee shape embedded on manager/team request listings. */
export type LeaveRequestEmployee = {
  id: string
  full_name?: string
  employee_number?: string
  department_name?: string
  position_title?: string
}

export type LeaveRequest = {
  id: string
  employee_id?: string
  employee?: LeaveRequestEmployee
  leave_type_id: string
  /** Embedded leave type, when the API expands the relation. */
  leave_type?: LeaveType
  start_date: string
  end_date: string
  is_half_day?: boolean
  half_day_period?: HalfDayPeriod | null
  working_days: number
  reason?: string | null
  status: LeaveRequestStatus
  status_label?: string
  can_be_cancelled?: boolean
  has_medical_certificate?: boolean
  submitted_at?: string | null
  reviewed_by?: string | null
  created_at?: string
  updated_at?: string
}

export type MyLeaveRequestsParams = {
  status?: LeaveRequestStatus
  leave_type_id?: string
  year?: number
  page?: number
  per_page?: number
}

export type PendingLeaveRequestsParams = {
  page?: number
  per_page?: number
}

export type SubmitLeaveRequestPayload = {
  leave_type_id: string
  start_date: string
  end_date: string
  is_half_day?: boolean
  half_day_period?: HalfDayPeriod
  reason?: string
}

export type MedicalCertificateUploadResult = {
  has_medical_certificate: boolean
}

export type MedicalCertificateDownload = {
  download_url: string
}
