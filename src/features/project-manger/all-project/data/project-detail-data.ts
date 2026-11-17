import type { AvatarColor, ProgressColor } from "./all-projects-data"

/* ================================================================== */
/* Header                                                             */
/* ================================================================== */

export const PROJECT_TABS = [
  "overview",
  "wbs",
  "schedule",
  "resources",
  "budget",
  "tasks",
  "documents",
  "chat",
  "reports",
] as const

export type ProjectTab = (typeof PROJECT_TABS)[number]

/* ================================================================== */
/* Overview                                                           */
/* ================================================================== */

export type PhaseState = "done" | "active" | "todo"

export type HealthState = "On Track" | "At Risk" | "Critical"

/** Health state → `ProjectsShared.health` message key. */
export const HEALTH_STATE_KEY = {
  "On Track": "onTrack",
  "At Risk": "atRisk",
  Critical: "critical",
} as const satisfies Record<HealthState, string>

export type MilestoneKind = "billing" | "internal"

/* ================================================================== */
/* WBS                                                                */
/* ================================================================== */

export type WbsStatus =
  | "On Track"
  | "Completed"
  | "In Progress"
  | "At Risk"
  | "Blocked"
  | "Planned"

/** WBS / status-pill vocabulary → `ProjectsShared.status` message key. */
export const WBS_STATUS_KEY = {
  "On Track": "onTrack",
  Completed: "completed",
  "In Progress": "inProgress",
  "At Risk": "atRisk",
  Blocked: "blocked",
  Planned: "planned",
} as const satisfies Record<WbsStatus, string>

export type WbsNode = {
  id: string
  level: 1 | 2 | 3 | 4
  kind: "Project" | "Phase" | "Workstream" | "Task"
  code: string
  name: string
  owner: { initials: string; color: AvatarColor }
  status: WbsStatus
  schedule: string
  budget: string
  children?: WbsNode[]
}

/* ================================================================== */
/* Schedule (Gantt)                                                   */
/* ================================================================== */

export type GanttKind = "phase" | "task" | "milestone"

export type GanttRow = {
  id: string
  name: string
  indent: boolean
  owner: { initials: string; color: AvatarColor }
  percent: number
  kind: GanttKind
  /** 1-based week index where the bar starts. */
  startWeek: number
  /** Number of weeks the bar spans (ignored for milestones). */
  span: number
  color: ProgressColor
  critical?: boolean
}

export const GANTT_LEGEND: {
  labelKey:
    | "legendPhase"
    | "legendTask"
    | "legendCriticalPath"
    | "legendMilestone"
    | "legendBillingMilestone"
  color: ProgressColor
  milestone?: boolean
}[] = [
  { labelKey: "legendPhase", color: "indigo" },
  { labelKey: "legendTask", color: "emerald" },
  { labelKey: "legendCriticalPath", color: "red" },
  { labelKey: "legendMilestone", color: "violet", milestone: true },
  { labelKey: "legendBillingMilestone", color: "amber", milestone: true },
]

/* ================================================================== */
/* Tasks (Kanban)                                                     */
/* ================================================================== */

export type TaskPriority = "Critical" | "High" | "Medium" | "Low"

/** Priority → `ProjectsShared.priority` message key. */
export const TASK_PRIORITY_KEY = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
} as const satisfies Record<TaskPriority, string>

export type KanbanTask = {
  id: string
  code: string
  title: string
  priority: TaskPriority
  owner: { initials: string; color: AvatarColor }
  comments: number
  attachments: number
}

export type KanbanColumnId =
  | "not-started"
  | "in-progress"
  | "blocked"
  | "in-review"
  | "done"

export type KanbanColumn = {
  id: KanbanColumnId
  title: string
  count: number
  dot: string
  tasks: KanbanTask[]
}

/* ================================================================== */
/* Documents                                                          */
/* ================================================================== */

/** Library folders; each is a `ProjectsProjectDetail.docFolder` message key. */
export const DOC_FOLDERS = [
  "all",
  "contracts",
  "drawings",
  "specifications",
  "approvals",
  "reports",
] as const

export type DocFolderKey = (typeof DOC_FOLDERS)[number]
export const DOC_TAGS = ["#Contract", "#BMS", "#Energy", "#Approval", "#Risk"]
