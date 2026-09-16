/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export type MilestoneType = "internal" | "billing"

export type MilestoneStatus = "pending" | "achieved" | "missed" | "cancelled"

export type DependencyType = "FS" | "SS" | "FF" | "SF"

/* ------------------------------------------------------------------ */
/* DTOs                                                                */
/* ------------------------------------------------------------------ */

export type Milestone = {
  id: string
  project_id: string
  name: string
  description: string | null
  target_date: string
  achieved_date: string | null
  type: MilestoneType
  type_label: string
  status: MilestoneStatus
  status_label: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

export type Baseline = {
  id: string
  project_id: string
  name: string
  description: string | null
  snapshot: {
    captured_at: string
    project_id: string
    tasks: Array<{
      task_id: string
      title: string
      planned_hours: string
      actual_hours: string
      percent_complete: string
      start_date: string | null
      due_date: string | null
      status: string
    }>
  }
  created_by: number
  created_at: string
}

export type Dependency = {
  id: string
  predecessor_task_id: string
  successor_task_id: string
  type: DependencyType
  type_label: string
  lag_days: number
  created_at: string
}

export type CriticalPathTask = {
  task_id: string
  duration_days: number
  early_start: number
  early_finish: number
  late_start: number
  late_finish: number
  total_float: number
  is_critical: boolean
}

export type CriticalPath = {
  project_id: string
  total_tasks: number
  critical_count: number
  tasks: CriticalPathTask[]
}

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

export type CreateMilestonePayload = {
  name: string
  description?: string | null
  target_date: string
  type?: MilestoneType
}

export type UpdateMilestonePayload = {
  name?: string
  description?: string | null
  target_date?: string
  type?: MilestoneType
  status?: MilestoneStatus
  achieved_date?: string | null
}

export type CreateBaselinePayload = {
  name: string
  description?: string | null
}

export type AddDependencyPayload = {
  predecessor_task_id: string
  type?: DependencyType
  lag_days?: number
}

/* ------------------------------------------------------------------ */
/* Portfolio schedule (all projects at once)                           */
/* ------------------------------------------------------------------ */

export type PortfolioScheduleParams = {
  from?: string
  to?: string
  status?: MilestoneStatus
}

export type PortfolioScheduleMilestone = {
  id: string
  project_id: string
  project_name: string
  title: string
  due_date: string
  status: string
  is_critical: boolean
  is_overdue: boolean
}

/** `GET /pm/schedule` — milestones across every active project. */
export type PortfolioSchedule = {
  summary: {
    milestones_total: number
    overdue: number
    due_this_week: number
    on_critical_path: number
  }
  milestones: PortfolioScheduleMilestone[]
}
