"use client"

import * as React from "react"
import { Lock } from "lucide-react"
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
import { Button } from "@/src/shared/components/ui/button"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useCompleteYearEndStep, useLockYear } from "../../lib/mutations/close"
import { useYearEnd } from "../../lib/queries/close"

/** Steps completed from this screen; the rest follow the periods and the lock. */
const STEP_ACTION: Record<string, string> = {
  adjustments: "Mark posted",
  income_statement: "Post closing entry",
}

/** 06.03 · Year end — zero the income statement into retained earnings and seal the year. */
function YearEndPage() {
  const { data, isError, refetch } = useYearEnd()
  const complete = useCompleteYearEndStep()
  const lock = useLockYear()
  const [confirming, setConfirming] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Year-end close"
        figure={
          data ? (
            <HeaderFigure label={`${data.fiscal_year} · steps complete`}>
              {data.done}/{data.total}
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="danger" disabled={!data?.can_lock || data?.locked} onClick={() => setConfirming(true)}>
            <Lock aria-hidden />
            {data?.locked ? "Year locked" : "Lock fiscal year"}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <>
            {data.locked ? (
              <FinanceAlert tone="success" className="text-status-success-fg">
                {data.fiscal_year} is locked. Every period in the year is sealed and takes no further postings.
              </FinanceAlert>
            ) : (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                Year-end close zeroes the income statement into retained earnings and locks every period in the year.
                This is a one-way operation, so complete every step first.
              </FinanceAlert>
            )}
            <FinanceSection
              title="Closing steps"
              action={
                <span className="text-content-tertiary text-[13px] leading-5 tabular-nums">
                  {data.done} of {data.total}
                </span>
              }
            >
              <ol className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
                {data.steps.map((step) => (
                  <li key={step.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                    <span className="bg-surface-hover text-content-secondary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                      {step.position}
                    </span>
                    <span className="flex min-w-60 flex-1 flex-col">
                      <span className="text-content-primary text-[13px] leading-5 font-medium">{step.title}</span>
                      <span className="text-content-secondary text-xs leading-4">{step.detail}</span>
                    </span>
                    {step.done ? <StatusPill status="done" label="Done" /> : <StatusPill status="pending" label="Pending" />}
                    {!step.done && STEP_ACTION[step.id] ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={complete.isPending}
                        onClick={() =>
                          complete.mutate(step.id, {
                            onSuccess: () =>
                              toast.success(
                                step.id === "income_statement"
                                  ? "FY2025 revenue and expenses are closed into 320101."
                                  : "Adjusting entries are marked as posted.",
                              ),
                            onError: (error) => toast.error(errorMessage(error, "The step could not be completed. Try again.")),
                          })
                        }
                      >
                        {STEP_ACTION[step.id]}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ol>
            </FinanceSection>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock {data?.fiscal_year}?</AlertDialogTitle>
            <AlertDialogDescription>
              Locking seals every period in the year. No entry can be posted into it again, and it cannot be undone in
              this prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                lock.mutate(undefined, {
                  onSuccess: (state) => toast.success(`${state.fiscal_year} is locked.`),
                  onError: (error) => toast.error(errorMessage(error, "The year could not be locked. Try again.")),
                })
              }
            >
              Lock fiscal year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { YearEndPage }
