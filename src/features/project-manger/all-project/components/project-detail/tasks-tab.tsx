"use client"

import { useMemo, useState } from "react"
import { ListFilter, MessageSquare, MoreHorizontal, Paperclip, Plus } from "lucide-react"
import { toast } from "sonner"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { toKanbanColumns } from "../../../lib/mappers/hierarchy-mapper"
import { useProjectHierarchy } from "../../../lib/queries/hierarchy"
import { useUpdateTaskStatus } from "../../../lib/mutations/tasks"
import type { TaskStatus, Timeline } from "../../../lib/types"
import {
  type KanbanColumn,
  type KanbanColumnId,
  type KanbanTask,
  type TaskPriority,
} from "../../data/project-detail-data"

/** Reverse of `COLUMN_FOR_STATUS` in hierarchy-mapper — column → backend status. */
const STATUS_FOR_COLUMN: Record<KanbanColumnId, TaskStatus> = {
  "not-started": "todo",
  "in-progress": "in_progress",
  blocked: "blocked",
  "in-review": "in_review",
  done: "done",
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  Critical: "text-brand-danger",
  High: "text-brand-warning",
  Medium: "text-brand-info",
  Low: "text-content-tertiary",
}

type DragState = { taskId: string; from: KanbanColumnId } | null

export function TasksTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectHierarchy(projectId)
  const updateStatus = useUpdateTaskStatus(projectId)
  const mapped = useMemo(() => toKanbanColumns(data ?? []), [data])

  const [columns, setColumns] = useState<KanbanColumn[]>(mapped)
  // Re-seed local (drag-reorderable) columns whenever the fetched tree changes.
  const [source, setSource] = useState<Timeline[] | undefined>(data)
  if (source !== data) {
    setSource(data)
    setColumns(mapped)
  }

  const [drag, setDrag] = useState<DragState>(null)
  const [overCol, setOverCol] = useState<KanbanColumnId | null>(null)

  const handleDrop = (targetId: KanbanColumnId) => {
    setOverCol(null)
    if (!drag || drag.from === targetId) {
      setDrag(null)
      return
    }
    const { taskId } = drag
    // Optimistic local move.
    setColumns((prev) => {
      let moved: KanbanTask | undefined
      const stripped = prev.map((col) => {
        if (col.id !== drag.from) return col
        moved = col.tasks.find((t) => t.id === taskId)
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
          count: col.count - 1,
        }
      })
      if (!moved) return prev
      return stripped.map((col) =>
        col.id === targetId
          ? { ...col, tasks: [...col.tasks, moved!], count: col.count + 1 }
          : col,
      )
    })
    setDrag(null)

    // Persist the new status; revert to the fetched tree on failure.
    updateStatus.mutate(
      { taskId, payload: { status: STATUS_FOR_COLUMN[targetId] } },
      {
        onError: (err) => {
          toast.error("Couldn't move task", {
            description: (err as unknown as ApiError).message,
          })
          setColumns(mapped)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
            Tasks &amp; Assignments
          </h2>
          <p className="text-content-tertiary text-sm">
            Kanban view of all open work for the active project
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-9 gap-2 px-3 text-[12px]">
            <ListFilter className="size-3.5" aria-hidden />
            Filter
          </Button>
          <Button variant="primary" className="h-9 gap-2 px-3 text-[12px]">
            <Plus className="size-4" aria-hidden />
            New Task
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-64 w-[280px] shrink-0 animate-pulse rounded-xl"
            />
          ))}
        </div>
      )}

      <div className={cn("flex gap-4 overflow-x-auto pb-2", isLoading && "hidden")}>
        {columns.map((column) => (
          <div
            key={column.id}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(column.id)
            }}
            onDragLeave={() => setOverCol((c) => (c === column.id ? null : c))}
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
                  <div className="flex items-center justify-between">
                    <span className="text-content-tertiary font-mono text-[11px]">
                      {task.code}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        PRIORITY_STYLE[task.priority],
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-content-primary text-[13px] leading-[18px] font-medium">
                    {task.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <Avatar color={task.owner.color} className="size-6 text-[10px]">
                      {task.owner.initials}
                    </Avatar>
                    <div className="text-content-quaternary flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3" aria-hidden />
                        {task.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Paperclip className="size-3" aria-hidden />
                        {task.attachments}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="border-stroke-default text-content-tertiary hover:border-brand-primary hover:text-brand-primary flex items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs font-medium transition-colors"
            >
              <Plus className="size-3.5" aria-hidden />
              Add Task
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
