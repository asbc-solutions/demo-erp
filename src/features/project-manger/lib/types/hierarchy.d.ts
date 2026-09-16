/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export type TimelineStatus = "draft" | "active" | "completed" | "on_hold"

export type PhaseStatus = "draft" | "active" | "completed" | "on_hold"

export type PhaseGateStatus = "open" | "passed" | "blocked"

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked"

export type TaskPriority = "low" | "medium" | "high" | "critical"

export type SubtaskStatus = "todo" | "in_progress" | "done"

/* ------------------------------------------------------------------ */
/* DTOs (Project → Timeline → Phase → Task → Subtask)                 */
/* ------------------------------------------------------------------ */

export type Subtask = {
  id: string
  task_id: string
  title: string
  description?: string | null
  sequence: number
  status: SubtaskStatus
  status_label: string
  assignee_id: string | null
  planned_hours: number | string
  actual_hours: number | string
  is_active: boolean
}

export type Task = {
  id: string
  phase_id: string
  title: string
  description?: string | null
  sequence: number
  status: TaskStatus
  status_label: string
  priority: TaskPriority
  priority_label: string
  assignee_id: string | null
  planned_hours: number | string
  actual_hours: number | string
  percent_complete: number
  start_date: string | null
  due_date: string | null
  is_active: boolean
  subtasks?: Subtask[]
}

export type Phase = {
  id: string
  timeline_id: string
  name: string
  description?: string | null
  sequence: number
  status: PhaseStatus
  status_label: string
  gate_status: PhaseGateStatus
  gate_status_label: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  tasks?: Task[]
}

export type Timeline = {
  id: string
  project_id: string
  name: string
  description?: string | null
  sequence: number
  status: TimelineStatus
  status_label: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  phases?: Phase[]
}

/** Roll-up payload shared by timeline/phase/task rollup endpoints. */
export type Rollup = {
  total_tasks?: number
  completed_tasks?: number
  total_subtasks: number
  completed_subtasks: number
  planned_hours: number
  actual_hours: number
  percent_complete: number
}

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

export type CreateTimelinePayload = {
  project_id: string
  name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: TimelineStatus
}

export type CreatePhasePayload = {
  timeline_id: string
  name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: PhaseStatus
  gate_status?: PhaseGateStatus
}

export type CreateTaskPayload = {
  phase_id: string
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  planned_hours?: number
  due_date?: string | null
  assignee_id?: string | null
}

export type CreateSubtaskPayload = {
  task_id: string
  title: string
  description?: string | null
  status?: SubtaskStatus
  planned_hours?: number
  assignee_id?: string | null
}

export type MoveNodePayload = {
  new_parent_id: string
  sequence: number
}

/* ------------------------------------------------------------------ */
/* Portfolio WBS index                                                 */
/* ------------------------------------------------------------------ */

/** Row from `GET /pm/wbs/summary` — one row per project. */
export type WbsIndexRow = {
  project_id: string
  project_name: string
  phases: number
  tasks: number
  levels: number
}
