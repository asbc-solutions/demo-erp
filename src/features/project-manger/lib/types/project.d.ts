/* ------------------------------------------------------------------ */
/* Enums (mirror the PM backend CHECK constraints)                    */
/* ------------------------------------------------------------------ */

export type ProjectType = "internal" | "external" | "capital" | "overhead"

export type ProjectClassification = "strategic" | "operational"

export type ProjectLifecycleStatus =
  | "created"
  | "released"
  | "technically_complete"
  | "closed"

export type StakeholderRole =
  | "sponsor"
  | "manager"
  | "team_lead"
  | "member"
  | "reviewer"
  | "observer"
  | "customer"
  | "vendor"

export type InfluenceLevel = "low" | "medium" | "high" | "critical"

/* ------------------------------------------------------------------ */
/* DTOs                                                                */
/* ------------------------------------------------------------------ */

/** Row shape returned by `GET /projects` (list + card aggregates). */
export type ProjectListItem = {
  id: string
  project_code: string
  name: string
  project_type: ProjectType
  classification: ProjectClassification
  customer_id: string | null
  manager_id: string | null
  status: ProjectLifecycleStatus
  status_label: string
  start_date: string
  end_date: string
  is_active: boolean

  // ── card aggregates (joined server-side) ──────────────────────────────
  manager_name: string | null
  budget_amount: number | null
  currency_code: string | null
  /** Average task percent_complete across the project (0–100). */
  progress: number
  tasks_total: number
  tasks_done: number
  /** Sum of `actual_costs` for the project. */
  spent: number
  phases_count: number
  /** Health level (task-derived), distinct from lifecycle `status`. */
  health_status: "On Track" | "At Risk" | "Critical"
}

/** `GET /pm/projects/stats` — All Projects stat cards. */
export type ProjectStats = {
  total: number
  new_this_month: number
  active_count: number
  at_risk_count: number
  by_status: Partial<Record<ProjectLifecycleStatus, number>>
  total_budget: number
  overdue_count: number
}

/** `POST /pm/projects/import` result. */
export type ImportProjectsResult = {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
}

export type ProjectCalendar = {
  calendar_id: string
  name: string
  working_days: string[]
  working_hours_start: string
  working_hours_end: string
  timezone: string
}

export type ProjectStakeholder = {
  id: string
  project_id: string
  employee_id: string
  role: StakeholderRole
  influence_level: InfluenceLevel
  notes: string | null
  is_active: boolean
}

/** Full shape returned by `GET /projects/{id}` — list fields + relations. */
export type Project = ProjectListItem & {
  name_local?: string | null
  description: string | null
  branch_id: string | null
  dept_id: string | null
  cost_centre_id: string | null
  currency_code: string
  budget_amount: string | null
  stakeholders: ProjectStakeholder[]
  calendar: ProjectCalendar | null
  created_at: string
  updated_at: string
}

/* ------------------------------------------------------------------ */
/* Templates                                                          */
/* ------------------------------------------------------------------ */

export type ProjectTemplate = {
  id: string
  template_code: string
  name: string
  description?: string | null
  project_type: ProjectType
  classification: ProjectClassification
  default_attributes: Record<string, unknown> | null
  hierarchy_blueprint: Record<string, unknown> | null
  is_active: boolean
}

/* ------------------------------------------------------------------ */
/* Params & payloads                                                  */
/* ------------------------------------------------------------------ */

export type ProjectListParams = {
  search?: string
  project_type?: ProjectType
  status?: ProjectLifecycleStatus
  customer_id?: string
  manager_id?: string
  branch_id?: string
  cost_centre_id?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export type CreateProjectPayload = {
  project_code: string
  name: string
  name_local?: string | null
  description?: string | null
  project_type: ProjectType
  classification: ProjectClassification
  customer_id?: string | null
  start_date: string
  end_date: string
  manager_id: string
  branch_id: string
  dept_id?: string | null
  cost_centre_id: string
  currency_code: string
  budget_amount?: number | null
  template_id?: string | null
}

/** PATCH-style — every field optional. */
export type UpdateProjectPayload = Partial<CreateProjectPayload>

export type AddStakeholderPayload = {
  employee_id: string
  role: StakeholderRole
  influence_level?: InfluenceLevel
  notes?: string | null
}

export type TemplateListParams = {
  search?: string
  is_active?: boolean
}
