// ─── Params ────────────────────────────────────────────────────────────────

export type HeadcountGroupBy =
  | "branch_id"
  | "dept_id"
  | "employment_status"
  | "employment_type"
  | "job_grade_id"

export type SalaryCostGroupBy = "cost_centre_id" | "branch_id" | "dept_id"

export type DocumentComplianceStatus = "missing" | "expired" | "expiring" | "valid"

export type ReportExportFormat = "csv" | "xlsx"

export type HeadcountParams = {
  group_by?: HeadcountGroupBy
  branch_id?: string
  dept_id?: string
  employment_status?: "active" | "probation" | "on_leave" | "terminated"
  employment_type?: "full_time" | "part_time" | "contract" | "internship" | "temporary"
  job_grade_id?: string
}

export type AttritionParams = {
  date_from?: string
  date_to?: string
  reason?: string
  dept_id?: string
}

export type SalaryCostParams = {
  group_by?: SalaryCostGroupBy
  date_from?: string
  date_to?: string
  cost_centre_id?: string
  branch_id?: string
  dept_id?: string
}

export type DocumentComplianceParams = {
  status?: DocumentComplianceStatus
  employee_id?: string
  is_mandatory?: boolean
}

export type TenureParams = {
  branch_id?: string
  dept_id?: string
}

// ─── Response types ─────────────────────────────────────────────────────────

export type KpiDashboard = {
  active_employees: number
  new_hires_mtd: number
  terminations_mtd: number
  open_vacancies: number
  expiring_contracts_90d: number
  pending_documents: number
}

// GET /reports/headcount → { data: { group_by, rows[] } }
export type HeadcountRow = {
  group_key: string
  group_label: string
  headcount: number
  active: number
  on_leave: number
  probation: number
}

export type HeadcountReport = {
  group_by: HeadcountGroupBy
  rows: HeadcountRow[]
}

// GET /reports/attrition → { data: { rows[] } }
export type AttritionPeriod = {
  period: string
  terminations: number
  headcount_start: number
  attrition_rate_pct: number
  reason_breakdown: Record<string, number>
}

export type AttritionReport = {
  rows: AttritionPeriod[]
}

// GET /reports/salary-cost → { data: { group_by, rows[] } }
// Monetary values are strings to avoid floating point loss; headcount is a number.
export type SalaryCostRow = {
  group_key: string
  group_label: string
  headcount: number
  total_gross: string
  total_net: string
  avg_gross: string
}

export type SalaryCostReport = {
  group_by: SalaryCostGroupBy
  rows: SalaryCostRow[]
}

// GET /reports/document-compliance → { data: { rows[] } }
export type DocumentComplianceItem = {
  document_id: string
  employee_id: string
  employee_name: string
  employee_number: string
  document_type: string
  document_title: string
  expiry_date: string | null
  days_until_expiry: number | null
  status: DocumentComplianceStatus
  is_mandatory: boolean
}

export type DocumentComplianceReport = {
  rows: DocumentComplianceItem[]
}

// GET /reports/tenure → { data: { buckets[], total_employees, avg_tenure_years } }
export type TenureBucket = {
  label: string
  count: number
  percentage: number
}

export type TenureReport = {
  buckets: TenureBucket[]
  total_employees: number
  avg_tenure_years: number
}
