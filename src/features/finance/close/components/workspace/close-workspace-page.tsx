"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { CircleAlert, CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { useClosePeriod, useSetTaskStatus } from "../../lib/mutations/close"
import { useCloseWorkspace } from "../../lib/queries/close"
import type { CloseTask, CloseWorkspace, ReadinessCheck } from "../../lib/types/close"

type CloseT = ReturnType<typeof useTranslations<"FinanceClose">>

function TaskStatusPill({ status }: { status: CloseTask["status"] }) {
  const t = useTranslations("FinanceClose")
  return (
    <StatusPill
      status={status}
      label={t(`taskStatus.${status}`)}
      tone={status === "not_started" ? "muted" : undefined}
    />
  )
}

function TaskRow({ task }: { task: CloseTask }) {
  const t = useTranslations("FinanceClose")
  const { formatDate } = useFinanceDateFormat()
  const setStatus = useSetTaskStatus()
  const move = (status: string, done: string) =>
    setStatus.mutate(
      { id: task.id, status },
      {
        onSuccess: () => toast.success(done),
        onError: (error) => toast.error(errorMessage(error, t("taskUpdateFailed"))),
      },
    )
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
      <div className="flex min-w-60 flex-1 flex-col gap-0.5">
        <span className="text-content-primary text-[13px] leading-5 font-medium">{task.title}</span>
        <span className="text-content-secondary text-xs leading-4">{task.description}</span>
        <span className="text-content-tertiary text-xs leading-4">
          {t("ownerDue", { owner: task.owner, date: formatDate(task.due_date) })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {task.blocking > 0 ? (
          <span className="text-status-danger-fg text-xs leading-4 font-medium tabular-nums">
            {t("blockingCount", { count: task.blocking })}
          </span>
        ) : null}
        <TaskStatusPill status={task.status} />
      </div>
      <div className="flex items-center gap-1">
        {task.can_sign_off && task.status === "not_started" ? (
          <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => move("in_progress", t("taskInProgress", { title: task.title }))}>
            {t("start")}
          </Button>
        ) : null}
        {task.can_sign_off && task.status !== "done" ? (
          <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => move("done", t("taskSignedOff", { title: task.title }))}>
            {t("markDone")}
          </Button>
        ) : null}
        {task.status === "done" && task.can_sign_off ? (
          <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => move("in_progress", t("taskOpenAgain", { title: task.title }))}>
            {t("reopen")}
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" asChild>
          <Link href={task.href}>{t("open")}</Link>
        </Button>
      </div>
    </li>
  )
}

function CheckRow({ check }: { check: ReadinessCheck }) {
  const t = useTranslations("FinanceClose")
  const Icon = check.pass ? CircleCheck : CircleAlert
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Icon
        className={cn("size-4 shrink-0", check.pass ? "text-status-success-fg" : "text-status-danger-fg")}
        aria-label={check.pass ? t("passes") : t("fails")}
      />
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

function verdict(data: CloseWorkspace, t: CloseT) {
  const { summary } = data
  const failing = summary.checks_total - summary.checks_passing
  if (summary.can_close) return t("verdictReady")
  return t("verdictBlocked", {
    incomplete: summary.incomplete,
    blocking: summary.blocking_total,
    failing,
  })
}

/** 06.01 · Close workspace — the March checklist, its blockers, and the checks that gate the close. */
function CloseWorkspacePage() {
  const t = useTranslations("FinanceClose")
  const tCommon = useTranslations("Common")
  const { data, isError, refetch } = useCloseWorkspace()
  const closePeriod = useClosePeriod()
  const [confirming, setConfirming] = React.useState(false)
  const closed = data ? data.period.status === "closed" || data.period.status === "locked" : false

  return (
    <>
      <FinancePageHeader
        title={t("workspaceTitle")}
        figure={
          data ? (
            <HeaderFigure label={t("tasksComplete", { period: data.period.label })}>
              {t("doneOfTotal", { done: data.summary.tasks_done, total: data.summary.tasks_total })}
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="primary" disabled={!data?.summary.can_close || closed} onClick={() => setConfirming(true)}>
            {closed ? t("periodClosedButton") : t("closePeriod")}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={t("loadingWorkspace")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="danger"
                label={t("blockingIssues")}
                value={data.summary.blocking_total}
                caption={t("acrossTasks", { count: data.summary.blocking_tasks })}
              />
              <KpiCard
                layout="bar"
                accent="warning"
                label={t("unreconciledAccounts")}
                value={data.summary.unreconciled_accounts}
                caption={t("bankAndCash")}
              />
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("closeReadiness")}
                value={`${data.summary.readiness_pct}%`}
                caption={t("tasksRemaining", { count: data.summary.incomplete })}
              />
            </div>
            {closed ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {data.period.closed_by
                  ? t("periodIsClosedBy", { period: data.period.label, name: data.period.closed_by })
                  : t("periodIsClosed", { period: data.period.label })}
              </FinanceAlert>
            ) : (
              <FinanceAlert tone={data.summary.can_close ? "success" : "warning"} className={data.summary.can_close ? "text-status-success-fg" : "text-status-warning-fg"}>
                {verdict(data, t)}
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
                        {t("doneOfTotal", { done: group.done, total: group.total })}
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
                title={t("readiness")}
                action={
                  <span className="text-content-tertiary text-[13px] leading-5 tabular-nums">
                    {t("checksPass", { passing: data.summary.checks_passing, total: data.summary.checks_total })}
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
            <AlertDialogTitle>{t("closePeriodTitle", { period: data?.period.label ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("closePeriodDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                data &&
                closePeriod.mutate(data.period.id, {
                  onSuccess: (period) => toast.success(t("periodClosed", { period: period.label })),
                  onError: (error) => toast.error(errorMessage(error, t("closeFailed"))),
                })
              }
            >
              {t("closePeriod")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { CloseWorkspacePage }
