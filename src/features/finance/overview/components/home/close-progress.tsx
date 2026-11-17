import * as React from "react"
import { cva } from "class-variance-authority"
import { useTranslations } from "next-intl"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/shared/components/ui/tooltip"

import type { CloseTask, CloseTaskStatus } from "../../lib/types/overview"


const segmentVariants = cva("h-full flex-1 first:rounded-s-full last:rounded-e-full", {
  variants: {
    status: {
      done: "bg-status-success-fg",
      in_progress: "bg-status-warning-fg",
      blocked: "bg-status-danger-fg",
      not_started: "bg-stroke-input",
    } satisfies Record<CloseTaskStatus, string>,
  },
})

/** One segment per close task, coloured by status, in checklist order. */
function CloseProgress({ tasks, done, total }: { tasks: CloseTask[]; done: number; total: number }) {
  const t = useTranslations("FinanceOverview")
  const counts = tasks.reduce<Record<CloseTaskStatus, number>>(
    (acc, task) => ({ ...acc, [task.status]: acc[task.status] + 1 }),
    { done: 0, in_progress: 0, blocked: 0, not_started: 0 },
  )
  const summary = t("closeProgressSummary", {
    done,
    total,
    inProgress: counts.in_progress,
    blocked: counts.blocked,
    notStarted: counts.not_started,
  })

  return (
    <div data-slot="close-progress" className="flex flex-col gap-2">
      <div role="img" aria-label={summary} className="flex h-2.5 w-full gap-0.5">
        {tasks.map((task) => (
          <Tooltip key={task.id}>
            <TooltipTrigger asChild>
              <span className={segmentVariants({ status: task.status })} />
            </TooltipTrigger>
            <TooltipContent>
              {task.title} · {t(`closeTaskStatus.${task.status}`)}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <p className="text-content-tertiary text-[13px] leading-5">
        {t("tasksDone", { done, total })}
      </p>
    </div>
  )
}

export { CloseProgress }
