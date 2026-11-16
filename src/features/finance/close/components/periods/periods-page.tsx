"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { formatDate } from "../../../lib/utils/date"
import { useClosePeriod, useReopenPeriod } from "../../lib/mutations/close"
import { useClosePeriods } from "../../lib/queries/close"

const reopenSchema = z.object({ reason: z.string().trim().min(1, "Give the reason. It is logged with your name.") })
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
          toast.success(`${updated.label} is open for adjustments.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The period could not be reopened. Try again.")),
      },
    )

  return (
    <Dialog open={Boolean(period)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Reopen this period?</DialogTitle>
            <DialogDescription>
              Reopening lets entries be posted into a period that has already been signed off and reported. Anyone
              reading the earlier reports will see different figures afterwards. The reopen is logged with your name and
              reason.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="reopen-reason">Reason</FieldLabel>
              <Textarea id="reopen-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || reopen.isPending}>
              Reopen period
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 06.02 · Financial periods — which periods take postings, and who closed the rest. */
function PeriodsPage() {
  const { data, isError, refetch } = useClosePeriods()
  const closePeriod = useClosePeriod()
  const [reopening, setReopening] = React.useState<FinancePeriod | null>(null)
  const [closing, setClosing] = React.useState<FinancePeriod | null>(null)

  const columns: FinanceColumn<FinancePeriod>[] = [
    { id: "period", header: "Period", cell: (row) => <span className="text-content-primary font-medium">{row.label}</span> },
    { id: "range", header: "Range", cell: (row) => `${formatDate(row.start_date)} – ${formatDate(row.end_date)}` },
    { id: "status", header: "Status", cell: (row) => <StatusPill status={`period-${row.status}`} label={row.status === "future" ? "not open" : row.status} tone={STATUS_TONE[row.status] ?? "neutral"} /> },
    { id: "closed_by", header: "Closed by", cell: (row) => row.closed_by ?? "—" },
    { id: "closed_on", header: "Closed on", cell: (row) => (row.closed_on ? formatDate(row.closed_on) : "—") },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "end",
      cell: (row) =>
        row.status === "closed" ? (
          <Button variant="ghost" size="sm" onClick={() => setReopening(row)}>
            Reopen
          </Button>
        ) : row.status === "open" || row.status === "closing" || row.status === "adjusting" ? (
          <Button variant="ghost" size="sm" onClick={() => setClosing(row)}>
            Close
          </Button>
        ) : null,
    },
  ]

  const visible = data?.items.filter((row) => row.status !== "future") ?? []

  return (
    <>
      <FinancePageHeader
        title="Financial periods"
        figure={data ? <HeaderFigure label="Open periods">{data.counts.open + data.counts.adjusting}</HeaderFigure> : null}
        actions={
          <Button variant="secondary" asChild>
            <Link href="/finance/periods/year-end">Year-end close</Link>
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
              <KpiCard layout="bar" accent="success" label="Open" value={data.counts.open} />
              <KpiCard layout="bar" accent="indigo" label="Closed" value={data.counts.closed} />
              <KpiCard layout="bar" accent="teal" label="Locked" value={data.counts.locked} />
              <KpiCard layout="bar" accent="amber" label="Adjusting" value={data.counts.adjusting} />
            </div>
            <FinanceAlert tone="info">
              Posting is only allowed into open periods. Closed periods can be reopened by a controller; locked periods
              are permanently sealed after year-end.
            </FinanceAlert>
            <FinanceTable caption="Financial periods" columns={columns} rows={visible} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>

      <ReopenDialog period={reopening} onOpenChange={(open) => !open && setReopening(null)} />

      <AlertDialog open={Boolean(closing)} onOpenChange={(open) => !open && setClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close {closing?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Periods close in order, and the period under close needs its checklist signed off first. Closing stops
              further postings into it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                closing &&
                closePeriod.mutate(closing.id, {
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

export { PeriodsPage }
