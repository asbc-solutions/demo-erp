"use client"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { useMyPriorities } from "../../lib/queries/my-work"
import type { MyPriority } from "../../lib/types"

const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  "Pending Approval": {
    badge: "bg-brand-warning/12 text-brand-warning",
    dot: "bg-brand-warning",
  },
  "In Progress": {
    badge: "bg-brand-info/12 text-brand-info",
    dot: "bg-brand-info",
  },
  "In Review": {
    badge: "bg-brand-primary/12 text-brand-primary",
    dot: "bg-brand-primary",
  },
}

const FALLBACK_STATUS_STYLE = {
  badge: "bg-surface-muted text-content-tertiary",
  dot: "bg-content-tertiary",
}

const ACCENT_DOT: Record<MyPriority["priority"], string> = {
  red: "bg-brand-danger",
  amber: "bg-brand-warning",
  indigo: "bg-brand-primary",
}

export function TodaysPrioritiesCard() {
  const { data, isLoading, isError } = useMyPriorities()
  const priorities = data ?? []

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            Today&apos;s Priorities
          </h2>
          <p className="text-content-tertiary text-[12px] leading-[17px]">
            Tasks and approvals scheduled for today
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-10 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          Couldn&apos;t load today&apos;s priorities.
        </p>
      ) : priorities.length === 0 ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          Nothing due today — you&apos;re all caught up.
        </p>
      ) : (
        <ul className="flex flex-col">
          {priorities.map((item) => {
            const status = STATUS_STYLE[item.status] ?? FALLBACK_STATUS_STYLE
            return (
              <li
                key={item.id}
                className="border-stroke-default flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    ACCENT_DOT[item.priority] ?? "bg-brand-primary",
                  )}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-content-primary truncate text-sm leading-5 font-medium">
                    {item.title}
                  </span>
                  <span className="text-content-tertiary truncate text-[12px] leading-[17px]">
                    {item.context_label}
                  </span>
                </div>
                {item.time_label ? (
                  <span className="text-content-tertiary shrink-0 text-[12px] leading-[17px] tabular-nums">
                    {item.time_label}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] leading-[17px] font-medium",
                    status.badge,
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", status.dot)}
                    aria-hidden
                  />
                  {item.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
