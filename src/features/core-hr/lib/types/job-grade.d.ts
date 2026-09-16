export type GradeCategory =
  | "executive"
  | "management"
  | "professional"
  | "technical"
  | "administrative"
  | "operational"

export type SalaryBand = {
  min: number
  mid: number
  max: number
  currency_code: string
}

export type GradeEntitlements = {
  overtime_eligible: boolean
  annual_leave_days: number
  sick_leave_days: number
}

/** Flat shape returned by GET /job-grades (list) */
export type JobGradeListItem = {
  id: string
  grade_code: string
  grade_name: string
  grade_level: number
  grade_category: GradeCategory
  description: string | null
  min_salary: number
  mid_salary: number
  max_salary: number
  currency_code: string
  overtime_eligible: boolean
  annual_leave_days: number
  sick_leave_days: number
  employee_count: number
  position_count: number
  is_active: boolean
}

/** A job from the Job Catalog classified under a grade (GET /job-grades/:id) */
export type LinkedJob = {
  id: string
  job_code: string
  job_title: string
  is_active: boolean
}

/** Nested shape returned by GET /job-grades/:id (detail) */
export type JobGrade = {
  id: string
  grade_code: string
  grade_name: string
  grade_name_local: string | null
  grade_level: number
  grade_category: GradeCategory
  description: string | null
  salary_band: SalaryBand
  entitlements: GradeEntitlements
  linked_jobs: LinkedJob[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type JobGradeListParams = {
  page?: number
  per_page?: number
  search?: string
  grade_level?: number
  grade_category?: GradeCategory
  annual_leave_days?: number
  sick_leave_days?: number
  is_active?: boolean
}

export type CreateJobGradePayload = {
  grade_code: string
  grade_name: string
  grade_name_local?: string
  grade_level: number
  grade_category: GradeCategory
  min_salary: number
  mid_salary: number
  max_salary: number
  currency_code: string
  description?: string
  overtime_eligible?: boolean
  annual_leave_days?: number
  sick_leave_days?: number
  is_active?: boolean
}

export type UpdateJobGradePayload = CreateJobGradePayload

export type ValidateBandPayload = {
  job_grade_id: string
  basic_salary: number
}

export type ValidateBandResult = {
  valid: boolean
  min: number
  mid: number
  max: number
  compa_ratio: number
  message: string
}
