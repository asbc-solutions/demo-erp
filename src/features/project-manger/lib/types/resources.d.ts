/* ------------------------------------------------------------------ */
/* DTOs                                                                 */
/* ------------------------------------------------------------------ */

/** Row from the global resource pool — HR employee LEFT JOIN pm profile. */
export type ResourcePoolItem = {
  employee_id: string
  employee_number: string
  first_name: string
  last_name: string
  email_work: string
  employment_status: string
  employment_type: string
  has_pm_profile: boolean
  bill_rate: number | null
  cost_rate_override: number | null
  pm_skills: string[] | null
  billable_default: boolean
}

export type ResourceProfile = {
  profile_id: string
  employee_id: string
  bill_rate: number | null
  cost_rate_override: number | null
  pm_skills: string[] | null
  billable_default: boolean
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

export type ResourceCapacityAssignment = {
  assignment_id: string
  task_id: string
  task_title: string
  phase_name: string
  timeline_name: string
  project_id: string
  project_name: string
  allocation_pct: number
  planned_hours: number
  start_date: string
  end_date: string
}

export type ResourceCapacity = {
  employee_id: string
  period: { from: string; to: string }
  total_allocated_pct: number
  available_pct: number
  assignments: ResourceCapacityAssignment[]
}

/** Row from `GET /projects/{id}/utilization` — resources assigned to a project. */
export type ProjectUtilizationRow = {
  employee_id: string
  employee_number: string
  name: string
  total_allocation_pct: number
  total_planned_hours: number
  assignment_count: number
}

export type ResourceAssignment = {
  assignment_id: string
  employee_id: string
  task_id: string
  allocation_pct: number
  planned_hours: number
  start_date: string
  end_date: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

/* ------------------------------------------------------------------ */
/* Params / payloads                                                   */
/* ------------------------------------------------------------------ */

export type ResourceListParams = {
  search?: string
  skill?: string
  billable_only?: boolean
  page?: number
  per_page?: number
}

export type CreateResourceProfilePayload = {
  employee_id: string
  bill_rate?: number
  cost_rate_override?: number
  pm_skills?: string[]
  billable_default?: boolean
}

export type UpdateResourceProfilePayload = {
  bill_rate?: number
  cost_rate_override?: number
  pm_skills?: string[]
  billable_default?: boolean
  is_active?: boolean
}

export type CreateAssignmentPayload = {
  employee_id: string
  task_id: string
  allocation_pct: number
  planned_hours?: number
  start_date: string
  end_date: string
}

/* ------------------------------------------------------------------ */
/* Portfolio planner (summary + heatmap)                               */
/* ------------------------------------------------------------------ */

/** Cards for the standalone Resource Planner page (portfolio-wide by default). */
export type ResourcePlannerSummary = {
  total_resources: number
  department_count: number
  average_utilization_pct: number
  overloaded_count: number
  suggested_matches_count: number
}

/** Optional `project_id` narrows the summary/heatmap to one project. */
export type ResourcePeriodParams = {
  from?: string
  to?: string
  project_id?: string
}

export type ResourceHeatmapWeek = {
  week_start: string
  week_end: string
  allocation_pct: number
  planned_hours: number
  available_pct: number
  overallocated: boolean
}

export type ResourceHeatmapRow = {
  employee_id: string
  name: string
  weeks: ResourceHeatmapWeek[]
}
