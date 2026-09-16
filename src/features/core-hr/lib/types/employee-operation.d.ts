export type EmployeeOperationType = "transfer" | "promotion" | "termination"
export type EmployeeOperationStatus = "preview" | "executed" | "failed"

export type TerminationType =
  | "resignation"
  | "retirement"
  | "contract_end"
  | "death"
  | "redundancy"
  | "termination"

export type EmployeeOperationListParams = {
  page?: number
  per_page?: number
  employee_id?: string
  operation_type?: EmployeeOperationType
  operation_status?: EmployeeOperationStatus
  date_from?: string
  date_to?: string
}

export type EmployeeOperationChange = {
  field: string
  from: unknown
  to: unknown
}

export type HeadcountImpactPosition = {
  position_id: string
  filled_before: number
  filled_after: number
}

export type HeadcountImpact = {
  origin_position?: HeadcountImpactPosition
  target_position?: HeadcountImpactPosition
}

export type FinalSettlement = {
  gratuity: number
  unused_leave: number
  pro_rata_salary: number
  total: number
  tenure_years?: number
  unused_leave_days?: number
  pro_rata_days_worked?: number
}

export type EmployeeOperationPreview = {
  valid: boolean
  changes?: EmployeeOperationChange[]
  headcount_impact?: HeadcountImpact
  final_settlement_estimate?: FinalSettlement
  warnings?: string[]
  next_steps?: string[]
}

export type EmployeeOperationResult = {
  id: string
  employee_id: string
  operation_type: EmployeeOperationType
  operation_status: EmployeeOperationStatus
  effective_date: string
  changes_applied?: EmployeeOperationChange[]
  warnings?: string[]
  next_steps?: string[]
  origin?: Record<string, unknown>
  target?: Record<string, unknown>
  final_settlement?: FinalSettlement
  termination?: {
    type: TerminationType
    date?: string
    reason?: string
  }
  executed_by?: number
  executed_at?: string
}

/**
 * Org-unit based transfer (matches the redesigned wizard: branch → department →
 * cost centre). NOTE: the current backend `/transfer` is position-based
 * (target_position_id) — see docs/backend-employee-operations.md for the change
 * required to accept this shape.
 */
export type TransferEmployeePayload = {
  target_branch_id: string
  target_dept_id: string
  target_cost_centre_id?: string | null
  effective_date: string
  reason: string
  notes?: string | null
  notify_employee?: boolean
  notify_manager?: boolean
}

export type TerminateEmployeePayload = {
  termination_type: TerminationType
  termination_date: string
  termination_reason: string
  unused_leave_days: number
}

export type PromoteEmployeePayload = {
  target_position_id: string
  new_job_grade_id: string
  new_basic_salary: number
  currency_code?: string
  effective_date: string
  reason?: string
}

export type PromoteSalaryChange = {
  /** Null when the employee has no current salary record to compare against. */
  previous_basic: number | null
  new_basic: number
  /** Null when there is no previous basic to diff against. */
  change_amount: number | null
  /** Null when there is no previous basic to compute a percentage from. */
  change_pct: number | null
}

export type PromoteBand = {
  grade_name: string
  min: number
  mid: number
  max: number
  compa_ratio: number
}

/** Richer preview returned by POST /employees/:id/promote/preview */
export type PromotePreview = {
  valid: boolean
  changes?: string[]
  salary_change?: PromoteSalaryChange
  band?: PromoteBand
  headcount_impact?: HeadcountImpact
  warnings?: string[]
  next_steps?: string[]
}
