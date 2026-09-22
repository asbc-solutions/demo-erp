"use client"

import * as React from "react"
import Link from "next/link"
import { CircleAlert, CircleCheck } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { useClosePeriod, useSetTaskStatus } from "../../lib/mutations/close"
import { useCloseWorkspace } from "../../lib/queries/close"
import type { CloseTask, CloseWorkspace, ReadinessCheck } from "../../lib/types/close"

const STATUS_PILL: Record<CloseTask["status"], React.ReactNode> = {
  done: <StatusPill status="done" label="Done" />,
  blocked: <StatusPill status="blocked" label="Blocked" />,
  in_progress: <StatusPill status="in_progress" label="In progress" />,
  not_started: <StatusPill status="not_started" label="Not started" tone="muted" />,
}

function TaskRow({ task }: { task: CloseTask }) {
  const setStatus = useSetTaskStatus()
  const move = (status: string, done: string) =>
    setStatus.mutate(
      { id: task.id, status },
      {
        onSuccess: () => toast.success(done),
        onError: (error) => toast.error(errorMessage(error, "The task could not be updated. Try again.")),
      },
    )
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
      <div className="flex min-w-60 flex-1 flex-col gap-0.5">
        <span className="text-content-primary text-[13px] leading-5 font-medium">{task.title}</span>
        <span className="text-content-secondary text-xs leading-4">{task.description}</span>
        <span className="text-content-tertiary text-xs leading-4">
          {task.owner} · due {formatDate(task.due_date)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {task.blocking > 0 ? (
          <span className="text-status-danger-fg text-xs leading-4 font-medium tabular-nums">{task.blocking} blocking</span>
        ) : null}
        {STATUS_PILL[task.status]}
      </div>
      <div className="flex items-center gap-1">
        {task.can_sign_off && task.status === "not_started" ? (
          <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => move("in_progress", `${task.title} is in progress.`)}>
            Start
          </Button>
        ) : null}
        {task.can_sign_off && task.status !== "done" ? (
          <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => move("done", `${task.title} is signed off.`)}>
            Mark done
          </Button>
        ) : null}
        {task.status === "done" && task.can_sign_off ? (
          <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => move("in_progress", `${task.title} is open again.`)}>
            Reopen
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" asChild>
          <Link href={task.href}>Open</Link>
        </Button>
      </div>
    </li>
  )
}

function CheckRow({ check }: { check: ReadinessCheck }) {
  const Icon = check.pass ? CircleCheck : CircleAlert
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Icon className={cn("size-4 shrink-0", check.pass ? "text-status-success-fg" : "text-status-danger-fg")} aria-label={check.pass ? "Passes" : "Fails"} />
      <Link href={check.href} className="flex min-w-0 flex-1 flex-col hover:underline">
        <span className="text-content-primary text-[13px] leading-5">{check.title}</span>
        <span className="text-content-tertiary text-xs leading-4">{check.detail}</span>
      </Link>
      {!check.pass && check.count > 0 ? (
        <span className="text-status-danger-fg text-xs leading-4 font-medium tabular-nums">{check.count}</span>
      ) : null}
    </li>
  )
}

function verdict(data: CloseWorkspace) {
  const { summary } = data
  const failing = summary.checks_total - summary.checks_passing
  if (summary.can_close) {
    return "Every task is signed off and every readiness check passes. Close the period to stop further postings to it."
  }
  return `This period can't close yet. ${summary.incomplete} checklist tasks are incomplete, ${summary.blocking_total} blocking items remain, and ${failing} readiness checks are failing. Clear each blocker and sign off the checklist below, then close the period.`
}

/** 06.01 · Close workspace — the March checklist, its blockers, and the checks that gate the close. */
function CloseWorkspacePage() {
  const { data, isError, refetch } = useCloseWorkspace()
  const closePeriod = useClosePeriod()
  const [confirming, setConfirming] = React.useState(false)
  const closed = data ? data.period.status === "closed" || data.period.status === "locked" : false

  return (
    <>
      <FinancePageHeader
        title="Period close"
        figure={
          data ? (
            <HeaderFigure label={`${data.period.label} · tasks complete`}>
              {data.summary.tasks_done} of {data.summary.tasks_total}
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="primary" disabled={!data?.summary.can_close || closed} onClick={() => setConfirming(true)}>
            {closed ? "Period closed" : "Close period"}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label="Loading close workspace" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="danger" label="Blocking issues" value={data.summary.blocking_total} caption={`across ${data.summary.blocking_tasks} tasks`} />
              <KpiCard layout="bar" accent="warning" label="Unreconciled accounts" value={data.summary.unreconciled_accounts} caption="bank and cash" />
              <KpiCard
                layout="bar"
                accent="indigo"
                label="Close readiness"
                value={`${data.summary.readiness_pct}%`}
                caption={`${data.summary.incomplete} checklist tasks remaining`}
              />
            </div>
            {closed ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {data.period.label} is closed{data.period.closed_by ? ` by ${data.period.closed_by}` : ""}. Posting into it now
                needs a controller to reopen it from Financial periods.
              </FinanceAlert>
            ) : (
              <FinanceAlert tone={data.summary.can_close ? "success" : "warning"} className={data.summary.can_close ? "text-status-success-fg" : "text-status-warning-fg"}>
                {verdict(data)}
              </FinanceAlert>
            )}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="flex flex-col gap-6">
                {data.groups.map((group) => (
                  <FinanceSection
                    key={group.name}
                    title={group.name}
                    action={
                      <span className="text-content-tertiary text-[13px] leading-5 tabular-nums">
                        {group.done} of {group.total}
                      </span>
                    }
                  >
                    <ul className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
                      {group.tasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </ul>
                  </FinanceSection>
                ))}
              </div>
              <FinanceSection
                title="Readiness"
                action={
                  <span className="text-content-tertiary text-[13px] leading-5 tabular-nums">
                    {data.summary.checks_passing} of {data.summary.checks_total} pass
                  </span>
                }
              >
                <ul className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
                  {data.checks.map((check) => (
                    <CheckRow key={check.id} check={check} />
                  ))}
                </ul>
              </FinanceSection>
            </div>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close {data?.period.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing stops further postings into the period. A controller can reopen it later from Financial periods;
              the reopen is logged with a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                data &&
                closePeriod.mutate(data.period.id, {
                  onSuccess: (period) => toast.success(`${period.label} is closed.`),
                  onError: (error) => toast.error(errorMessage(error, "The period could not be closed. Try again.")),
                })
              }
            >
              Close period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { CloseWorkspacePage }
