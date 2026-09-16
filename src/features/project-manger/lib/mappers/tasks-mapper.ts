import type {
  KanbanColumnId,
  TaskPriority as ViewTaskPriority,
} from "../../all-project/data/project-detail-data"
import type {
  PersonRef,
  TaskListItem,
  TaskStatus,
  TaskPriority,
} from "../types"
import { formatApiDate } from "./project-mapper"

/* ------------------------------------------------------------------ */
/* Column definitions                                                  */
/* ------------------------------------------------------------------ */

const COLUMN_META: { id: KanbanColumnId; title: string; dot: string }[] = [
  { id: "not-started", title: "Not Started", dot: "bg-content-tertiary" },
  { id: "in-progress", title: "In Progress", dot: "bg-brand-primary" },
  { id: "blocked", title: "Blocked", dot: "bg-brand-danger" },
  { id: "in-review", title: "In Review", dot: "bg-brand-info" },
  { id: "done", title: "Done", dot: "bg-brand-success" },
]

const COLUMN_FOR_STATUS: Record<TaskStatus, KanbanColumnId> = {
  todo: "not-started",
  in_progress: "in-progress",
  blocked: "blocked",
  in_review: "in-review",
  done: "done",
}

/** Reverse of {@link COLUMN_FOR_STATUS} — used when a card is dropped. */
export const COLUMN_TO_STATUS: Record<KanbanColumnId, TaskStatus> = {
  "not-started": "todo",
  "in-progress": "in_progress",
  blocked: "blocked",
  "in-review": "in_review",
  done: "done",
}

const PRIORITY_LABEL: Record<TaskPriority, ViewTaskPriority> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

/* ------------------------------------------------------------------ */
/* Portfolio board view model                                          */
/* ------------------------------------------------------------------ */

export type BoardTask = {
  id: string
  title: string
  priority: ViewTaskPriority
  projectId: string
  phaseName: string
  dueDate: string
  percent: number
  status: TaskStatus
  assignee: PersonRef | null
}

export type BoardColumn = {
  id: KanbanColumnId
  title: string
  dot: string
  count: number
  tasks: BoardTask[]
}

/** Group the flat cross-project task list into Kanban columns by status. */
export function tasksToBoard(tasks: TaskListItem[]): BoardColumn[] {
  const byColumn = new Map<KanbanColumnId, BoardTask[]>()
  for (const meta of COLUMN_META) byColumn.set(meta.id, [])

  for (const task of tasks) {
    const columnId = COLUMN_FOR_STATUS[task.status] ?? "not-started"
    byColumn.get(columnId)!.push({
      id: task.task_id,
      title: task.title,
      priority: PRIORITY_LABEL[task.priority] ?? "Medium",
      projectId: task.project_id,
      phaseName: task.phase_name,
      dueDate: formatApiDate(task.due_date),
      percent: task.percent_complete,
      status: task.status,
      assignee: task.assignee ?? null,
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
