"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ListFilter, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Progress } from "@/src/shared/components/ui/progress"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import type {
  KanbanColumnId,
  TaskPriority,
} from "../../all-project/data/project-detail-data"
import {
  COLUMN_TO_STATUS,
  tasksToBoard,
  type BoardColumn,
  type BoardTask,
} from "../../lib/mappers/tasks-mapper"
import { useUpdateTaskStatus } from "../../lib/mutations/tasks"
import { useTasks } from "../../lib/queries/tasks"

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  Critical: "text-brand-danger",
  High: "text-brand-warning",
  Medium: "text-brand-info",
  Low: "text-content-tertiary",
}

type DragState = { taskId: string; from: KanbanColumnId } | null

/** Apply in-flight optimistic moves (`taskId → column`) on top of server data. */
function applyOverrides(
  columns: BoardColumn[],
  overrides: Record<string, KanbanColumnId>,
): BoardColumn[] {
  if (Object.keys(overrides).length === 0) return columns
  const buckets = new Map<KanbanColumnId, BoardTask[]>()
  for (const col of columns) buckets.set(col.id, [])
  for (const col of columns) {
    for (const task of col.tasks) {
      const target = overrides[task.id] ?? col.id
      const bucket = buckets.get(target) ?? buckets.get(col.id)!
      bucket.push(
        target === col.id
          ? task
          : { ...task, status: COLUMN_TO_STATUS[target] },
      )
    }
  }
  return columns.map((col) => {
    const tasks = buckets.get(col.id)!
    return { ...col, tasks, count: tasks.length }
  })
}

export function TasksAssignmentsModule() {
  const { data, isLoading, isError } = useTasks({ per_page: 100 })
  const updateStatus = useUpdateTaskStatus()

  const serverColumns = useMemo(() => tasksToBoard(data ?? []), [data])

  // Optimistic moves (taskId → target column) applied on top of server data,
  // so drag feels instant without mirroring server state in an effect.
  const [overrides, setOverrides] = useState<Record<string, KanbanColumnId>>({})
  const columns = useMemo(
    () => applyOverrides(serverColumns, overrides),
    [serverColumns, overrides],
  )

  const [drag, setDrag] = useState<DragState>(null)
  const [overCol, setOverCol] = useState<KanbanColumnId | null>(null)

  const clearOverride = (taskId: string) =>
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })

  const handleDrop = (targetId: KanbanColumnId) => {
    setOverCol(null)
    if (!drag || drag.from === targetId) {
      setDrag(null)
      return
    }
    const { taskId } = drag
    setDrag(null)

    setOverrides((prev) => ({ ...prev, [taskId]: targetId }))
    updateStatus.mutate(
      { taskId, payload: { status: COLUMN_TO_STATUS[targetId] } },
      {
        onSuccess: () => clearOverride(taskId),
        onError: (err) => {
          clearOverride(taskId) // revert
          toast.error("Couldn't move task", {
            description: (err as unknown as ApiError).message,
          })
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            Tasks &amp; Assignments
          </h1>
          <p className="text-content-tertiary text-sm">
            Kanban of all open work across every project — drag to update status
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="border-stroke-default text-content-secondary hover:text-content-primary flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px]"
          >
            <ListFilter className="size-3.5" aria-hidden />
            Filter
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-64 w-[280px] shrink-0 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-content-tertiary py-16 text-center text-sm">
          Couldn&apos;t load tasks.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault()
                setOverCol(column.id)
              }}
              onDragLeave={() =>
                setOverCol((c) => (c === column.id ? null : c))
              }
              onDrop={() => handleDrop(column.id)}
              className={cn(
                "flex w-[280px] shrink-0 flex-col gap-3 rounded-xl p-2 transition-colors",
                overCol === column.id && drag
                  ? "bg-brand-primary/5 ring-brand-primary/30 ring-2"
                  : "bg-transparent",
              )}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", column.dot)} />
                  <span className="text-content-primary text-[13px] font-semibold">
                    {column.title}
                  </span>
                  <span className="bg-surface-muted text-content-tertiary rounded-full px-1.5 text-[11px] font-medium">
                    {column.count}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Column options"
                  className="text-content-quaternary hover:text-content-primary"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {column.tasks.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() =>
                      setDrag({ taskId: task.id, from: column.id })
                    }
                    onDragEnd={() => {
                      setDrag(null)
                      setOverCol(null)
                    }}
                    className={cn(
                      "bg-surface-white border-stroke-light flex cursor-grab flex-col gap-2 rounded-xl border p-3 shadow-[0px_1px_1.5px_0px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md active:cursor-grabbing",
                      drag?.taskId === task.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-content-tertiary truncate text-[11px]">
                        {task.phaseName}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[11px] font-semibold",
                          PRIORITY_STYLE[task.priority],
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-content-primary text-[13px] leading-[18px] font-medium">
                      {task.title}
                    </p>
                    {task.percent > 0 ? (
                      <Progress
                        value={task.percent}
                        color="indigo"
                        className="bg-surface-muted h-1"
                      />
                    ) : null}
                    <div className="text-content-quaternary flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" aria-hidden />
                        {task.dueDate}
                      </span>
                      <span className="tabular-nums">{task.percent}%</span>
                    </div>
                    {task.assignee ? (
                      <div className="border-stroke-light flex items-center gap-1.5 border-t pt-2">
                        <Avatar
                          color="primary"
                          className="size-5 text-[9px]"
                          title={task.assignee.name}
                        >
                          {task.assignee.initials ??
                            task.assignee.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <span className="text-content-tertiary truncate text-[11px]">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
