export type EmploymentStatus =
  | "active"
  | "inactive"
  | "terminated"
  | "resigned"
  | "retired"
  | "on_leave"
  | "suspended"
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "temporary"
export type Gender = "male" | "female" | "other"
export type MaritalStatus = "single" | "married" | "divorced" | "widowed"

export type EmployeeListParams = {
  page?: number
  per_page?: number
  search?: string
  branch_id?: string
  dept_id?: string
  employment_status?: EmploymentStatus
  employment_type?: EmploymentType
  job_grade_id?: string
  manager_id?: string
  is_active?: boolean
}

/** Shape returned in GET /employees list */
export type EmployeeListItem = {
  id: string
  employee_number: string
  full_name: string
  avatar_initials: string
  dept_id: string | null
  position_id: string | null
  employment_status: EmploymentStatus
  employment_type: EmploymentType
  hire_date: string
  is_active: boolean
}

/** Extra KPI fields merged into list meta */
export type EmployeeListMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
  total_headcount: number
  open_positions: number
  avg_tenure_years: number
  department_count: number
}

/** Shape returned by GET /employees/:id */
export type Employee = {
  id: string
  employee_number: string
  full_name: string
  avatar_initials: string
  is_active: boolean
  personal_info: {
    first_name: string
    last_name: string
    date_of_birth: string | null
    gender: Gender | null
    marital_status: MaritalStatus | null
    nationality: string | null
    national_id: string | null
    blood_type: string | null
  }
  contact: {
    email_work: string
    phone_mobile: string | null
  }
  address: {
    city: string | null
    country: string | null
  }
  employment: {
    branch_id: string | null
    dept_id: string | null
    position_id: string | null
    job_grade_id: string | null
    manager_id: string | null
    employment_status: EmploymentStatus
    employment_type: EmploymentType
    hire_date: string
  }
}

/** Flat payload for POST /employees (only required fields mandatory) */
export type CreateEmployeePayload = {
  first_name: string
  last_name: string
  email_work: string
  hire_date: string
  employment_type: EmploymentType
  phone_mobile?: string | null
  gender?: Gender | null
  marital_status?: MaritalStatus | null
  nationality?: string | null
  national_id?: string | null
  date_of_birth?: string | null
  blood_type?: string | null
  city?: string | null
  country?: string | null
  branch_id?: string | null
  dept_id?: string | null
  position_id?: string | null
  job_grade_id?: string | null
  manager_id?: string | null
}

/** Flat partial payload for PUT /employees/:id */
export type UpdateEmployeePayload = Partial<CreateEmployeePayload>

export type DirectReport = {
  id: string
  employee_number: string
  full_name: string
  email_work: string
  employment_status: EmploymentStatus
  hire_date: string
}

export type OrgChartNode = {
  id: string
  employee_number: string
  full_name: string
  position_id: string | null
  relation: "manager" | "direct_report"
}

export type EmployeeOrgChart = {
  manager_chain: OrgChartNode[]
  direct_reports: OrgChartNode[]
}

export type EmployeeExportFormat = "xlsx" | "csv" | "pdf"
export type EmployeeExportScope = "all" | "filtered" | "selected"

/** Body for POST /employees/export (Bulk Export) */
export type EmployeeExportPayload = {
  format: EmployeeExportFormat
  scope: EmployeeExportScope
  /** Column selection + order; empty/omitted exports every column. */
  columns?: string[]
  /** Required when scope=filtered — same filters as GET /employees. */
  filters?: Omit<EmployeeListParams, "page" | "per_page">
  /** Required when scope=selected. */
  ids?: string[]
  /** Without extension; server defaults to "Employees_export". */
  filename?: string
}

export type EmployeeExportJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"

/** Shape returned by GET /employees/export/:job_id (and the 202 response) */
export type EmployeeExportJob = {
  job_id: string
  status: EmployeeExportJobStatus
  filename?: string
  /** Signed URL valid for 15 minutes; present when status=completed. */
  download_url?: string
  /** Present when status=failed. */
  error?: string
}
