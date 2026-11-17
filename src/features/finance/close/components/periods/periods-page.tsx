"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import type { FinancePeriod } from "../../../lib/types/common"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { useClosePeriod, useReopenPeriod } from "../../lib/mutations/close"
import { useClosePeriods } from "../../lib/queries/close"

/** The message is a `FinanceClose` key, translated where the error is rendered. */
const reopenSchema = z.object({ reason: z.string().trim().min(1, "errorReopenReason") })
type ReopenValues = z.infer<typeof reopenSchema>

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "muted"> = {
  open: "success",
  closing: "warning",
  adjusting: "warning",
  closed: "neutral",
  locked: "neutral",
  future: "muted",
}

function ReopenDialog({ period, onOpenChange }: { period: FinancePeriod | null; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceClose")
  const tCommon = useTranslations("Common")
  const reopen = useReopenPeriod()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ReopenValues>({ resolver: zodResolver(reopenSchema), mode: "onChange", defaultValues: { reason: "" } })

  React.useEffect(() => {
    if (period) reset({ reason: "" })
  }, [period, reset])

  const submit = ({ reason }: ReopenValues) =>
    period &&
    reopen.mutate(
      { id: period.id, reason },
      {
        onSuccess: (updated) => {
          toast.success(t("periodReopened", { period: updated.label }))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, t("reopenFailed"))),
      },
    )

  return (
    <Dialog open={Boolean(period)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("reopenTitle")}</DialogTitle>
            <DialogDescription>{t("reopenDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="reopen-reason">{t("reason")}</FieldLabel>
              <Textarea id="reopen-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{t("errorReopenReason")}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || reopen.isPending}>
              {t("reopenPeriod")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 06.02 · Financial periods — which periods take postings, and who closed the rest. */
function PeriodsPage() {
  const t = useTranslations("FinanceClose")
  const tCommon = useTranslations("Common")
  const tShared = useTranslations("FinanceShared")
  const { formatDate } = useFinanceDateFormat()
  const { data, isError, refetch } = useClosePeriods()
  const closePeriod = useClosePeriod()
  const [reopening, setReopening] = React.useState<FinancePeriod | null>(null)
  const [closing, setClosing] = React.useState<FinancePeriod | null>(null)

  const columns: FinanceColumn<FinancePeriod>[] = [
    { id: "period", header: t("period"), cell: (row) => <span className="text-content-primary font-medium">{row.label}</span> },
    {
      id: "range",
      header: t("colRange"),
      cell: (row) => t("dateRange", { from: formatDate(row.start_date), to: formatDate(row.end_date) }),
    },
    {
      id: "status",
      header: t("colStatus"),
      cell: (row) => (
        <StatusPill
          status={`period-${row.status}`}
          label={tShared(`periodStatus.${row.status}`)}
          tone={STATUS_TONE[row.status] ?? "neutral"}
        />
      ),
    },
    { id: "closed_by", header: t("colClosedBy"), cell: (row) => row.closed_by ?? "—" },
    { id: "closed_on", header: t("colClosedOn"), cell: (row) => (row.closed_on ? formatDate(row.closed_on) : "—") },
    {
      id: "action",
      header: <span className="sr-only">{t("colAction")}</span>,
      align: "end",
      cell: (row) =>
        row.status === "closed" ? (
          <Button variant="ghost" size="sm" onClick={() => setReopening(row)}>
            {t("reopen")}
          </Button>
        ) : row.status === "open" || row.status === "closing" || row.status === "adjusting" ? (
          <Button variant="ghost" size="sm" onClick={() => setClosing(row)}>
            {tCommon("close")}
          </Button>
        ) : null,
    },
  ]

  const visible = data?.items.filter((row) => row.status !== "future") ?? []

  return (
    <>
      <FinancePageHeader
        title={t("periodsTitle")}
        figure={data ? <HeaderFigure label={t("openPeriods")}>{data.counts.open + data.counts.adjusting}</HeaderFigure> : null}
        actions={
          <Button variant="secondary" asChild>
            <Link href="/finance/periods/year-end">{t("yearEndTitle")}</Link>
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton count={4} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="success" label={t("countOpen")} value={data.counts.open} />
              <KpiCard layout="bar" accent="indigo" label={t("countClosed")} value={data.counts.closed} />
              <KpiCard layout="bar" accent="teal" label={t("countLocked")} value={data.counts.locked} />
              <KpiCard layout="bar" accent="amber" label={t("countAdjusting")} value={data.counts.adjusting} />
            </div>
            <FinanceAlert tone="info">{t("periodsNote")}</FinanceAlert>
            <FinanceTable caption={t("periodsTitle")} columns={columns} rows={visible} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>

      <ReopenDialog period={reopening} onOpenChange={(open) => !open && setReopening(null)} />

      <AlertDialog open={Boolean(closing)} onOpenChange={(open) => !open && setClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("closePeriodTitle", { period: closing?.label ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("closePeriodOrderDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                closing &&
                closePeriod.mutate(closing.id, {
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

export { PeriodsPage }
