export type TaskStatus = "to_do" | "in_progress" | "review" | "done" | "blocked"
export type TaskPriority = "low" | "medium" | "high" | "critical"

export type TaskProjectRef = {
  id: string
  name: string
}

export type TaskAssignee = {
  id: string
  name: string
}

/** Shape returned by GET /operations/tasks and as the `data` of create/update responses. */
export type TaskListItem = {
  id: string
  title: string
  description: string | null
  project: TaskProjectRef | null
  assignee: TaskAssignee | null
  priority: TaskPriority
  priority_label: string
  status: TaskStatus
  status_label: string
  completed: boolean
  due_date: string | null
  is_overdue: boolean
  completed_at: string | null
}

export type TaskListParams = {
  project_id?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  search?: string
  page?: number
  per_page?: number
}

export type CreateTaskPayload = {
  title: string
  project_id?: string
  description?: string
  /** Must reference an existing row in `employees` — same person record as HR. */
  assignee_employee_id?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
}

/**
 * PATCH /operations/tasks/{id} — dual purpose: send `completed` as a shorthand
 * checkbox toggle (backend translates it to `status`/`completed_at`), or send any
 * other fields for a regular edit. If both `status` and `completed` are sent,
 * `status` wins.
 */
export type UpdateTaskPayload = {
  completed?: boolean
  status?: TaskStatus
  title?: string
  description?: string
  project_id?: string
  assignee_employee_id?: string
  priority?: TaskPriority
  due_date?: string
}
