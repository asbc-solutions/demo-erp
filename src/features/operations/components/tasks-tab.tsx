"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  TASK_FILTER_OPTIONS,
  TASK_PRIORITY_DOT,
  TASK_STATUS_DOT,
  TASK_STATUS_OPTIONS,
} from "../data/operations-mock"
import { OPERATIONS_RESOURCES } from "../lib/constants/permissions"
import { useUpdateTask } from "../lib/mutations/tasks"
import { useTasks } from "../lib/queries/tasks"
import type { TaskListItem, TaskStatus } from "../lib/types"
import { formatDate, getInitials } from "../lib/utils/format"

import { OperationsErrorState, toastMutationError } from "./shared/operations-error-state"
import { OperationsPageSpinner } from "./shared/operations-loading"

export function TasksTab() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all")
  const [query, setQuery] = useState("")
  const { can } = usePermissions()
  const canManage = can.write(OPERATIONS_RESOURCES.tasks)

  const tasksQuery = useTasks({ per_page: 100 })
  const updateTask = useUpdateTask()

  const allTasks = useMemo(() => tasksQuery.data?.data ?? [], [tasksQuery.data])

  const counts = useMemo(() => {
    const result: Record<TaskStatus | "all", number> = {
      all: allTasks.length,
      to_do: 0,
      in_progress: 0,
      review: 0,
      done: 0,
      blocked: 0,
    }
    for (const task of allTasks) {
      result[task.status] += 1
    }
    return result
  }, [allTasks])

  const tasks = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    return allTasks.filter((task) => {
      if (filter !== "all" && task.status !== filter) return false
      if (!trimmed) return true
      return (
        task.title.toLowerCase().includes(trimmed) ||
        (task.assignee?.name ?? "").toLowerCase().includes(trimmed) ||
        (task.project?.name ?? "").toLowerCase().includes(trimmed)
      )
    })
  }, [allTasks, filter, query])

  const handleStatusChange = (task: TaskListItem, status: TaskStatus) => {
    if (status === task.status) return
    updateTask.mutate(
      { id: task.id, payload: { status } },
      { onError: (err) => toastMutationError(err, "Failed to update task") },
    )
  }

  if (tasksQuery.isLoading) {
    return <OperationsPageSpinner />
  }

  if (tasksQuery.isError) {
    return (
      <OperationsErrorState
        message="Failed to load tasks."
        onRetry={() => void tasksQuery.refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search
            className="text-content-tertiary absolute top-1/2 inset-s-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks by title or assignee..."
            className="h-9 ps-9 text-[13px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TASK_FILTER_OPTIONS.map((option) => {
            const isActive = filter === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] leading-[15.4px] font-medium transition-colors",
                  isActive
                    ? "border-transparent bg-brand-primary text-white"
                    : "border-stroke-default bg-surface-white text-content-secondary hover:text-content-primary",
                )}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    isActive ? "text-white/90" : "text-content-tertiary",
                  )}
                >
                  {counts[option.value]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="border-stroke-default bg-surface-white text-content-tertiary flex h-16 items-center justify-center rounded-2xl border border-dashed text-[12px] leading-[18px]">
            No tasks match the current filters.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-surface-white border-stroke-default grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto_auto] items-center gap-4 rounded-2xl border px-4 py-3.5"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  TASK_STATUS_DOT[task.status],
                )}
                aria-hidden
              />
              <p
                className={cn(
                  "text-content-primary text-[12px] leading-[18px] font-medium",
                  task.completed && "text-content-primary/70 line-through",
                )}
              >
                {task.title}
              </p>
              <span className="bg-[#f4f4f5] inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] leading-[15px] font-medium text-content-tertiary">
                {task.project?.name ?? "No project"}
              </span>
              <div className="flex items-center gap-1.5">
                {task.assignee ? (
                  <>
                    <span className="bg-brand-primary/15 text-brand-primary flex size-5 items-center justify-center rounded-full text-[9px] leading-[13.5px]">
                      {getInitials(task.assignee.name)}
                    </span>
                    <span className="text-content-tertiary text-[11px] leading-[15.4px]">
                      {task.assignee.name}
                    </span>
                  </>
                ) : (
                  <span className="text-content-tertiary text-[11px] leading-[15.4px]">
                    Unassigned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    TASK_PRIORITY_DOT[task.priority],
                  )}
                  aria-hidden
                />
                <span className="text-content-tertiary text-[11px] leading-[15.4px]">
                  {task.priority_label}
                </span>
              </div>
              <Select
                value={task.status}
                onValueChange={(value) => handleStatusChange(task, value as TaskStatus)}
                disabled={!canManage || updateTask.isPending}
              >
                <SelectTrigger className="h-9 w-28 text-[11px] shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span
                className={cn(
                  "text-[11px] leading-[15.4px] tabular-nums",
                  task.is_overdue && !task.completed
                    ? "text-brand-danger"
                    : "text-content-secondary",
                )}
              >
                {task.due_date ? formatDate(task.due_date) : "No due date"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
