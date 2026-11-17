"use client"

import * as React from "react"
import { Lock } from "lucide-react"
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

/** Steps completed from this screen (`FinanceClose` keys); the rest follow the periods and the lock. */
const STEP_ACTION: Partial<Record<string, "stepMarkPosted" | "stepPostClosingEntry">> = {
  adjustments: "stepMarkPosted",
  income_statement: "stepPostClosingEntry",
}

/** 06.03 · Year end — zero the income statement into retained earnings and seal the year. */
function YearEndPage() {
  const t = useTranslations("FinanceClose")
  const tCommon = useTranslations("Common")
  const { data, isError, refetch } = useYearEnd()
  const complete = useCompleteYearEndStep()
  const lock = useLockYear()
  const [confirming, setConfirming] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("yearEndTitle")}
        figure={
          data ? (
            <HeaderFigure label={t("stepsComplete", { year: data.fiscal_year })}>
              {data.done}/{data.total}
            </HeaderFigure>
          ) : null
        }
        actions={
          <Button variant="danger" disabled={!data?.can_lock || data?.locked} onClick={() => setConfirming(true)}>
            <Lock aria-hidden />
            {data?.locked ? t("yearLocked") : t("lockFiscalYear")}
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
                {t("yearIsLocked", { year: data.fiscal_year })}
              </FinanceAlert>
            ) : (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                {t("yearEndWarning")}
              </FinanceAlert>
            )}
            <FinanceSection
              title={t("closingSteps")}
              action={
                <span className="text-content-tertiary text-[13px] leading-5 tabular-nums">
                  {t("doneOfTotal", { done: data.done, total: data.total })}
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
                    {step.done ? (
                      <StatusPill status="done" label={t("done")} />
                    ) : (
                      <StatusPill status="pending" label={t("pending")} />
                    )}
                    {!step.done && STEP_ACTION[step.id] ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={complete.isPending}
                        onClick={() =>
                          complete.mutate(step.id, {
                            onSuccess: () =>
                              toast.success(
                                step.id === "income_statement" ? t("incomeStatementClosed") : t("adjustmentsMarkedPosted"),
                              ),
                            onError: (error) => toast.error(errorMessage(error, t("stepFailed"))),
                          })
                        }
                      >
                        {t(STEP_ACTION[step.id] ?? "stepMarkPosted")}
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
            <AlertDialogTitle>{t("lockYearTitle", { year: data?.fiscal_year ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("lockYearDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                lock.mutate(undefined, {
                  onSuccess: (state) => toast.success(t("yearLockedToast", { year: state.fiscal_year })),
                  onError: (error) => toast.error(errorMessage(error, t("lockFailed"))),
                })
              }
            >
              {t("lockFiscalYear")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { YearEndPage }
