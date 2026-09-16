import type { ProjectListItem } from "./project"

/* ------------------------------------------------------------------ */
/* Enums                                                                */
/* ------------------------------------------------------------------ */

/** Health level (distinct from lifecycle status). */
export type HealthStatus = "On Track" | "At Risk" | "Critical"

export type ProjectMembership = "managed" | "contributing" | "following"

export type MyPriorityKind =
  | "approval"
  | "task"
  | "change_request"
  | "meeting"
  | "milestone"

export type MyActivityKind =
  | "task_completed"
  | "mention"
  | "invoice"
  | "document"
  | "risk"

/* ------------------------------------------------------------------ */
/* DTOs — `GET /pm/me/*`                                                */
/* ------------------------------------------------------------------ */

/** `GET /pm/me/summary` — personal KPI stat cards. */
export type MySummary = {
  active_projects: { count: number; on_track: number; needs_attention: number }
  tasks_due_today: { count: number; high_priority: number }
  hours_this_week: { booked: number; capacity: number; remaining: number }
  approvals_pending: { count: number; gates: number; change_requests: number }
}

/** Row from `GET /pm/me/priorities`. */
export type MyPriority = {
  id: string
  title: string
  project_name: string
  kind: MyPriorityKind
  context_label: string
  time_label: string | null
  status: string
  priority: "red" | "amber" | "indigo"
}

export type MyCapacityBreakdownRow = {
  id: string
  label: string
  hours: number
  color: string
}

/** `GET /pm/me/capacity` — booked vs total hours for a week. */
export type MyCapacity = {
  booked_hours: number
  total_hours: number
  breakdown: MyCapacityBreakdownRow[]
}

/** Row from `GET /pm/me/projects` — enriched list row + membership. */
export type MyProjectItem = ProjectListItem & {
  membership: ProjectMembership
}

/** Row from `GET /pm/me/activity`. */
export type MyActivityItem = {
  id: string
  text: string
  occurred_at: string
  time_label: string
  kind: MyActivityKind
}

/** `GET /pm/me/projects/stats` — My Projects stat cards. */
export type MyProjectsStats = {
  managed_count: number
  contributing_count: number
  following_count: number
  avg_health_pct: number
  avg_health_delta_pct: number | null
}

/** Row from `GET /pm/me/milestones`. */
export type MyMilestone = {
  id: string
  title: string
  project_name: string
  due_date: string
  date_label: string
  relative_label: string
  urgent: boolean
}

/* ------------------------------------------------------------------ */
/* Params / payloads                                                    */
/* ------------------------------------------------------------------ */

export type MyProjectsParams = {
  membership?: ProjectMembership
  status?: ProjectListItem["status"]
  page?: number
  per_page?: number
}

export type MyMilestonesParams = {
  horizon_days?: number
  limit?: number
}

export type DigestSection =
  | "health"
  | "milestones"
  | "risks"
  | "focus"
  | "budget"

/** `POST /pm/reports/weekly-digest`. */
export type WeeklyDigestPayload = {
  project_id: string
  recipient_ids: string[]
  include?: DigestSection[]
  note?: string
}

export type WeeklyDigestResult = {
  sent: boolean
  recipient_count: number
}
