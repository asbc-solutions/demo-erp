import type { AvatarColor, ProgressColor } from "./all-projects-data"

/* ================================================================== */
/* Header                                                             */
/* ================================================================== */

export const PROJECT_TABS = [
  "Overview",
  "WBS",
  "Schedule",
  "Resources",
  "Budget",
  "Tasks",
  "Documents",
  "Chat",
  "Reports",
] as const

export type ProjectTab = (typeof PROJECT_TABS)[number]

/* ================================================================== */
/* Overview                                                           */
/* ================================================================== */

export type PhaseState = "done" | "active" | "todo"

export type HealthState = "On Track" | "At Risk" | "Critical"

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

export const GANTT_LEGEND: { label: string; color: ProgressColor; milestone?: boolean }[] = [
  { label: "Phase", color: "indigo" },
  { label: "Task", color: "emerald" },
  { label: "Critical Path", color: "red" },
  { label: "Milestone", color: "violet", milestone: true },
  { label: "Billing milestone", color: "amber", milestone: true },
]

/* ================================================================== */
/* Tasks (Kanban)                                                     */
/* ================================================================== */

export type TaskPriority = "Critical" | "High" | "Medium" | "Low"

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

export const DOC_FOLDERS = [
  "All Documents",
  "Contracts",
  "Drawings",
  "Specifications",
  "Approvals",
  "Reports",
]
export const DOC_TAGS = ["#Contract", "#BMS", "#Energy", "#Approval", "#Risk"]
