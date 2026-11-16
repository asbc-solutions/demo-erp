"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
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
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { AccountSelect } from "../../../components/shared/account-select"
import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCreateRecurring, useRunRecurring, useToggleRecurring } from "../../lib/mutations/ledger"
import { useRecurringJournals } from "../../lib/queries/ledger"
import { recurringSchema, type RecurringFormValues } from "../../lib/schema/ledger"
import type { RecurringJournal } from "../../lib/types/ledger"

const EMPTY: RecurringFormValues = { name: "", cadence: "monthly", next_run: "2026-04-01", debit_account: "", credit_account: "", amount: "" }

function RowActions({ row }: { row: RecurringJournal }) {
  const toggle = useToggleRecurring()
  const run = useRunRecurring()
  const busy = toggle.isPending || run.isPending
  return (
    <span className="flex justify-end gap-1">
      {row.status === "active" ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() =>
            run.mutate(row.id, {
              onSuccess: (result) => toast.success(`${result.journal} was drafted. The next run is ${formatDate(result.next_run)}.`),
              onError: (error) => toast.error(errorMessage(error, "The draft could not be generated. Try again.")),
            })
          }
        >
          Generate draft
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() =>
          toggle.mutate(row.id, {
            onSuccess: (updated) => toast.success(`${updated.name} is ${updated.status === "active" ? "running again" : "paused"}.`),
            onError: (error) => toast.error(errorMessage(error, "The template could not be updated. Try again.")),
          })
        }
      >
        {row.status === "active" ? "Pause" : "Resume"}
      </Button>
    </span>
  )
}

const COLUMNS: FinanceColumn<RecurringJournal>[] = [
  { id: "name", header: "Template", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "cadence", header: "Cadence", cell: (row) => (row.cadence === "monthly" ? "Monthly" : "Quarterly") },
  { id: "next", header: "Next run", cell: (row) => formatDate(row.next_run) },
  {
    id: "account",
    header: "Account",
    cell: (row) => (
      <span className="flex flex-col">
        <span className="font-mono text-xs">{row.debit_account}</span>
        <span className="text-content-secondary text-xs">{row.debit_name}</span>
      </span>
    ),
  },
  { id: "amount", header: "Amount (EGP)", align: "end", cell: (row) => <Amount value={row.amount} /> },
  {
    id: "status",
    header: "Status",
    cell: (row) => (row.status === "active" ? <StatusPill status="ready" label="Active" /> : <StatusPill status="paused" label="Paused" tone="muted" />),
  },
  { id: "actions", header: <span className="sr-only">Actions</span>, align: "end", cell: (row) => <RowActions row={row} /> },
]

function NewRecurringDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateRecurring()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecurringFormValues>({ resolver: zodResolver(recurringSchema), defaultValues: EMPTY })

  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const submit = (values: RecurringFormValues) =>
    create.mutate(
      { ...values, amount: Number(values.amount) },
      {
        onSuccess: (row) => {
          toast.success(`${row.name} will draft ${formatAmount(row.amount)} EGP from ${formatDate(row.next_run)}.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The recurring journal could not be saved. Try again.")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>New recurring journal</DialogTitle>
            <DialogDescription>
              It drafts a journal on each run date. Drafts wait for review, so nothing posts to a closed period unattended.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="recurring-name">Name *</FieldLabel>
              <Input id="recurring-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="recurring-cadence">Cadence *</FieldLabel>
                <Controller
                  control={control}
                  name="cadence"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="recurring-cadence">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="recurring-next">First run *</FieldLabel>
                <Input id="recurring-next" type="date" {...register("next_run")} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="recurring-debit">Debit *</FieldLabel>
              <Controller
                control={control}
                name="debit_account"
                render={({ field }) => <AccountSelect id="recurring-debit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.debit_account)} />}
              />
              {errors.debit_account ? <FieldError>{errors.debit_account.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="recurring-credit">Credit *</FieldLabel>
              <Controller
                control={control}
                name="credit_account"
                render={({ field }) => <AccountSelect id="recurring-credit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.credit_account)} />}
              />
              {errors.credit_account ? <FieldError>{errors.credit_account.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="recurring-amount">Amount (EGP) *</FieldLabel>
              <Input id="recurring-amount" inputMode="decimal" placeholder="0.00" className="text-end tabular-nums" aria-invalid={Boolean(errors.amount)} {...register("amount")} />
              {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 05.09 · Recurring journals — templates that draft themselves on a schedule. */
function RecurringPage() {
  const { data, isError, refetch } = useRecurringJournals()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Recurring journals"
        figure={data ? <HeaderFigure label="Active templates">{data.active_count}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New recurring journal
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Active templates" value={data.active_count} />
              <KpiCard layout="bar" accent="teal" label="Monthly value (EGP)" value={formatAmount(data.monthly_value)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Next run"
                value={data.next_run ? formatDate(data.next_run) : "—"}
                caption={data.next_run_names.join(", ")}
              />
            </div>
            <FinanceAlert tone="info">
              Recurring templates generate a draft journal on their next-run date. Drafts wait for review before posting,
              so a template never posts to a closed period unattended.
            </FinanceAlert>
            <FinanceTable caption="Recurring journals" columns={COLUMNS} rows={data.items} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
      <NewRecurringDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { RecurringPage }
