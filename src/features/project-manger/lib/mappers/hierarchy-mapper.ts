import type {
  WbsNode,
  WbsStatus,
  KanbanColumn,
  KanbanColumnId,
  KanbanTask,
  TaskPriority as ViewTaskPriority,
} from "../../all-project/data/project-detail-data"
import type {
  Timeline,
  Task,
  TaskStatus,
  TaskPriority,
} from "../types"
import type { ProjectsSharedT } from "../utils/translator"
import { formatApiDate } from "./project-mapper"

/* ------------------------------------------------------------------ */
/* Status / priority maps                                              */
/* ------------------------------------------------------------------ */

/** Backend node status → the `StatusPill`/WBS label vocabulary. */
function toWbsStatus(status: string): WbsStatus {
  switch (status) {
    case "done":
    case "completed":
      return "Completed"
    case "in_progress":
    case "active":
    case "in_review":
      return "In Progress"
    case "blocked":
      return "Blocked"
    case "on_hold":
      return "At Risk"
    default:
      return "Planned"
  }
}

const PRIORITY_LABEL: Record<TaskPriority, ViewTaskPriority> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

type ScheduleFormat = { t: ProjectsSharedT; locale?: string }

function schedule(
  start: string | null,
  end: string | null,
  { t, locale }: ScheduleFormat,
): string {
  if (!start && !end) return "—"
  return t("dateRange", {
    start: formatApiDate(start, locale),
    end: formatApiDate(end, locale),
  })
}

const UNKNOWN_OWNER = { initials: "?", color: "neutral" as const }

/* ------------------------------------------------------------------ */
/* WBS tree (Timeline → Phase → Task → Subtask)                        */
/* ------------------------------------------------------------------ */

export function toWbsNodes(
  timelines: Timeline[],
  format: ScheduleFormat,
): WbsNode[] {
  return timelines.map((timeline, ti) => {
    const tCode = `${ti + 1}.0`
    return {
      id: timeline.id,
      level: 1,
      kind: "Project",
      code: tCode,
      name: timeline.name,
      owner: UNKNOWN_OWNER,
      status: toWbsStatus(timeline.status),
      schedule: schedule(timeline.start_date, timeline.end_date, format),
      budget: "—",
      children: (timeline.phases ?? []).map((phase, pi) => {
        const pCode = `${ti + 1}.${pi + 1}`
        return {
          id: phase.id,
          level: 2,
          kind: "Phase",
          code: pCode,
          name: phase.name,
          owner: UNKNOWN_OWNER,
          status: toWbsStatus(phase.status),
          schedule: schedule(phase.start_date, phase.end_date, format),
          budget: "—",
          children: (phase.tasks ?? []).map((task, ki) => {
            const kCode = `${pCode}.${ki + 1}`
            return {
              id: task.id,
              level: 3,
              kind: "Workstream",
              code: kCode,
              name: task.title,
              owner: UNKNOWN_OWNER,
              status: toWbsStatus(task.status),
              schedule: schedule(task.start_date, task.due_date, format),
              budget: "—",
              children: (task.subtasks ?? []).map((sub, si) => ({
                id: sub.id,
                level: 4 as const,
                kind: "Task" as const,
                code: `${kCode}.${si + 1}`,
                name: sub.title,
                owner: UNKNOWN_OWNER,
                status: toWbsStatus(sub.status),
                schedule: "—",
                budget: "—",
              })),
            }
          }),
        }
      }),
    }
  })
}

/* ------------------------------------------------------------------ */
/* Kanban (flatten all tasks, group by status)                         */
/* ------------------------------------------------------------------ */

const COLUMN_FOR_STATUS: Record<TaskStatus, KanbanColumnId> = {
  todo: "not-started",
  in_progress: "in-progress",
  blocked: "blocked",
  in_review: "in-review",
  done: "done",
}

const COLUMN_META: { id: KanbanColumnId; title: string; dot: string }[] = [
  { id: "not-started", title: "Not Started", dot: "bg-content-tertiary" },
  { id: "in-progress", title: "In Progress", dot: "bg-brand-primary" },
  { id: "blocked", title: "Blocked", dot: "bg-brand-danger" },
  { id: "in-review", title: "In Review", dot: "bg-brand-info" },
  { id: "done", title: "Done", dot: "bg-brand-success" },
]

function flattenTasks(timelines: Timeline[]): Task[] {
  const out: Task[] = []
  for (const timeline of timelines) {
    for (const phase of timeline.phases ?? []) {
      for (const task of phase.tasks ?? []) out.push(task)
    }
  }
  return out
}

export function toKanbanColumns(timelines: Timeline[]): KanbanColumn[] {
  const tasks = flattenTasks(timelines)
  const byColumn = new Map<KanbanColumnId, KanbanTask[]>()
  for (const meta of COLUMN_META) byColumn.set(meta.id, [])

  for (const task of tasks) {
    const columnId = COLUMN_FOR_STATUS[task.status] ?? "not-started"
    byColumn.get(columnId)!.push({
      id: task.id,
      code: `T-${task.sequence}`,
      title: task.title,
      priority: PRIORITY_LABEL[task.priority] ?? "Medium",
      owner: UNKNOWN_OWNER,
      comments: 0,
      attachments: 0,
    })
  }

  return COLUMN_META.map((meta) => {
    const columnTasks = byColumn.get(meta.id)!
    return {
      id: meta.id,
      title: meta.title,
      dot: meta.dot,
      count: columnTasks.length,
      tasks: columnTasks,
    }
  })
}
