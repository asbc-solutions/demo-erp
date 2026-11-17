"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCreateRecurring, useRunRecurring, useToggleRecurring } from "../../lib/mutations/ledger"
import { useRecurringJournals } from "../../lib/queries/ledger"
import { recurringSchema, type RecurringFormValues } from "../../lib/schema/ledger"
import type { LedgerMessageKey, LedgerTranslator, RecurringJournal } from "../../lib/types/ledger"

const EMPTY: RecurringFormValues = { name: "", cadence: "monthly", next_run: "2026-04-01", debit_account: "", credit_account: "", amount: "" }

function RowActions({ row }: { row: RecurringJournal }) {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
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
              onSuccess: (result) => toast.success(t("toastDrafted", { journal: result.journal, date: formatDate(result.next_run) })),
              onError: (error) => toast.error(errorMessage(error, t("errorGenerateDraft"))),
            })
          }
        >
          {t("generateDraft")}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() =>
          toggle.mutate(row.id, {
            onSuccess: (updated) => toast.success(t(updated.status === "active" ? "toastResumed" : "toastPaused", { name: updated.name })),
            onError: (error) => toast.error(errorMessage(error, t("errorUpdateTemplate"))),
          })
        }
      >
        {row.status === "active" ? t("pause") : t("resume")}
      </Button>
    </span>
  )
}

function buildColumns(t: LedgerTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<RecurringJournal>[] {
  return [
    { id: "name", header: t("template"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "cadence", header: t("cadence"), cell: (row) => (row.cadence === "monthly" ? t("cadenceMonthly") : t("cadenceQuarterly")) },
    { id: "next", header: t("nextRun"), cell: (row) => formatDate(row.next_run) },
    {
      id: "account",
      header: t("account"),
      cell: (row) => (
        <span className="flex flex-col">
          <span className="font-mono text-xs">{row.debit_account}</span>
          <span className="text-content-secondary text-xs">{row.debit_name}</span>
        </span>
      ),
    },
    { id: "amount", header: t("amountEgp"), align: "end", cell: (row) => <Amount value={row.amount} /> },
    {
      id: "status",
      header: t("status"),
      cell: (row) => (row.status === "active" ? <StatusPill status="ready" label={t("active")} /> : <StatusPill status="paused" label={t("paused")} tone="muted" />),
    },
    { id: "actions", header: <span className="sr-only">{t("actions")}</span>, align: "end", cell: (row) => <RowActions row={row} /> },
  ]
}

function NewRecurringDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
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
          toast.success(t("toastRecurringCreated", { name: row.name, amount: formatAmount(row.amount), date: formatDate(row.next_run) }))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, t("errorSaveRecurring"))),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("newRecurringJournal")}</DialogTitle>
            <DialogDescription>{t("newRecurringDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="recurring-name">{t("nameRequired")}</FieldLabel>
              <Input id="recurring-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="recurring-cadence">{t("cadenceRequired")}</FieldLabel>
                <Controller
                  control={control}
                  name="cadence"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="recurring-cadence">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t("cadenceMonthly")}</SelectItem>
                        <SelectItem value="quarterly">{t("cadenceQuarterly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="recurring-next">{t("firstRunRequired")}</FieldLabel>
                <Input id="recurring-next" type="date" {...register("next_run")} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="recurring-debit">{t("debitRequired")}</FieldLabel>
              <Controller
                control={control}
                name="debit_account"
                render={({ field }) => <AccountSelect id="recurring-debit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.debit_account)} />}
              />
              {errors.debit_account ? <FieldError>{t(errors.debit_account.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="recurring-credit">{t("creditRequired")}</FieldLabel>
              <Controller
                control={control}
                name="credit_account"
                render={({ field }) => <AccountSelect id="recurring-credit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.credit_account)} />}
              />
              {errors.credit_account ? <FieldError>{t(errors.credit_account.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="recurring-amount">{t("amountEgpRequired")}</FieldLabel>
              <Input id="recurring-amount" inputMode="decimal" placeholder="0.00" className="text-end tabular-nums" aria-invalid={Boolean(errors.amount)} {...register("amount")} />
              {errors.amount ? <FieldError>{t(errors.amount.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 05.09 · Recurring journals — templates that draft themselves on a schedule. */
function RecurringPage() {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const { data, isError, refetch } = useRecurringJournals()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("recurringJournals")}
        figure={data ? <HeaderFigure label={t("activeTemplates")}>{data.active_count}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newRecurringJournal")}
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
              <KpiCard layout="bar" accent="indigo" label={t("activeTemplates")} value={data.active_count} />
              <KpiCard layout="bar" accent="teal" label={t("monthlyValueEgp")} value={formatAmount(data.monthly_value)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("nextRun")}
                value={data.next_run ? formatDate(data.next_run) : "—"}
                caption={data.next_run_names.join(", ")}
              />
            </div>
            <FinanceAlert tone="info">
              {t("recurringInfo")}
            </FinanceAlert>
            <FinanceTable caption={t("recurringJournals")} columns={columns} rows={data.items} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
      <NewRecurringDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { RecurringPage }
