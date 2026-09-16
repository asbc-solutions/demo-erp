export type ProjectStatus = "planning" | "active" | "on_hold" | "completed"

export type ProjectLead = {
  id: string
  name: string
}

/** Shape returned by GET /operations/projects and as the `data` of create/update responses. */
export type ProjectListItem = {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  status_label: string
  progress_pct: number
  budget_amount: number
  spent_amount: number
  remaining_budget: number
  currency_code: string
  lead: ProjectLead | null
  start_date: string | null
  end_date: string | null
  is_overdue: boolean
}

export type ProjectListParams = {
  status?: ProjectStatus
  lead_employee_id?: string
  search?: string
  page?: number
  per_page?: number
}

export type CreateProjectPayload = {
  name: string
  description?: string
  status?: ProjectStatus
  progress_pct?: number
  budget_amount?: number
  spent_amount?: number
  /** Must reference an existing row in `employees` — Operations has no owner list of its own. */
  lead_employee_id?: string
  start_date?: string
  end_date?: string
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

/** GET /operations/projects/kpis — the 4 tiles above the Projects tab. */
export type ProjectKpis = {
  active_projects: number
  total_budget: number
  total_spent: number
  overdue_tasks: number
}
