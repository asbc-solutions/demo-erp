import type { TaskStatus, TaskPriority } from "./hierarchy"
import type { PersonRef } from "./people"

/* ------------------------------------------------------------------ */
/* Enums                                                                */
/* ------------------------------------------------------------------ */

export type TaskAssigneeRole = "owner" | "contributor"

/* ------------------------------------------------------------------ */
/* DTOs                                                                 */
/* ------------------------------------------------------------------ */

/** Row from `GET /pm/tasks` — flat task list (not the hierarchy `Task`). */
export type TaskListItem = {
  task_id: string
  phase_id: string
  phase_name: string
  project_id: string
  title: string
  assignee_id: string | null
  /** Resolved display object for the owner assignee. */
  assignee: PersonRef | null
  status: TaskStatus
  priority: TaskPriority
  percent_complete: number
  start_date: string | null
  due_date: string | null
  planned_hours: number
  actual_hours: number
}

export type TaskAssignee = {
  assignee_id: string
  task_id: string
  employee_id: string
  role: TaskAssigneeRole
  is_active: boolean
  created_by?: number
  created_at?: string
  updated_at?: string
}

export type TimeLog = {
  log_id: string
  task_id: string | null
  subtask_id: string | null
  employee_id: string
  hours: number
  log_date: string
  billable: boolean
  note: string | null
  is_active: boolean
  created_at: string
}

export type EmployeeWorkloadTask = {
  task_id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  planned_hours: number
  actual_hours: number
  percent_complete: number
  start_date: string | null
  due_date: string | null
  phase_name: string
  timeline_name: string
  project_id: string
  project_name: string
}

export type EmployeeWorkload = {
  employee_id: string
  open_task_count: number
  total_planned_hours: number
  tasks: EmployeeWorkloadTask[]
}

/* ------------------------------------------------------------------ */
/* Params / payloads                                                   */
/* ------------------------------------------------------------------ */

export type TaskListParams = {
  phase_id?: string
  assignee_id?: string
  status?: TaskStatus
  priority?: TaskPriority
  search?: string
  due_before?: string
  page?: number
  per_page?: number
}

export type UpdateTaskStatusPayload = {
  status: TaskStatus
  percent_complete?: number
}

export type AddTaskAssigneePayload = {
  employee_id: string
  role: TaskAssigneeRole
}

export type LogTimePayload = {
  task_id?: string
  subtask_id?: string
  employee_id: string
  hours: number
  log_date: string
  billable: boolean
  note?: string
}
