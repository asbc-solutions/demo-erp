"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserX } from "lucide-react"
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
import { EmptyState } from "@/src/shared/components/ui/empty-state"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import type { StatusTone } from "../../../lib/constants/statuses"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useSettleCustody, useWriteOffCustody } from "../../lib/mutations/banking"
import { useCustodyHolder } from "../../lib/queries/banking"
import { reasonSchema, settleSchema, type ReasonFormValues, type SettleFormValues } from "../../lib/schema/banking"
import type { CustodyHolder, CustodyMovementType } from "../../lib/types/banking"

const TYPE_PILL: Record<CustodyMovementType, { label: string; tone: StatusTone }> = {
  advance: { label: "advance", tone: "info" },
  settle: { label: "settle", tone: "success" },
  return: { label: "cash returned", tone: "neutral" },
  write_off: { label: "written off", tone: "danger" },
}

const COLUMNS: FinanceColumn<CustodyHolder["movements"][number]>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  {
    id: "memo",
    header: "Memo",
    cell: (row) => (
      <span className="flex flex-wrap items-center gap-2">
        {row.memo}
        <StatusPill status={`custody-${row.type}`} label={TYPE_PILL[row.type].label} tone={TYPE_PILL[row.type].tone} />
      </span>
    ),
  },
  { id: "amount", header: "Amount (EGP)", align: "end", cell: (row) => <Amount value={row.amount} /> },
]

function SettleDialog({ holder, open, onOpenChange }: { holder: CustodyHolder; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: treasuries = [] } = useFinanceTreasuries()
  const settle = useSettleCustody(holder.id)
  const empty = React.useMemo<SettleFormValues>(
    () => ({ expenses: String(holder.outstanding), cash_returned: "", treasury_id: holder.treasury_id, date: "2026-03-31" }),
    [holder.outstanding, holder.treasury_id],
  )
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettleFormValues>({ resolver: zodResolver(settleSchema), defaultValues: empty })

  React.useEffect(() => {
    if (open) reset(empty)
  }, [open, reset, empty])

  const submit = (values: SettleFormValues) =>
    settle.mutate(
      {
        expenses: Number(values.expenses || 0),
        cash_returned: Number(values.cash_returned || 0),
        treasury_id: values.treasury_id,
        date: values.date,
      },
      {
        onSuccess: (updated) => {
          toast.success(
            updated.outstanding > 0
              ? `${updated.name} still holds ${formatAmount(updated.outstanding)} EGP.`
              : `${updated.name}'s custody is cleared.`,
          )
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The custody could not be settled. Try again.")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Settle this custody?</DialogTitle>
            <DialogDescription>
              Settlement posts the employee&apos;s expense claims against the custody and returns any unspent cash
              to the treasury. The outstanding amount drops by what you settle. Partial settlements are allowed.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-content-secondary text-[13px] leading-5">
              Outstanding: <span className="text-content-primary font-medium tabular-nums">{formatAmount(holder.outstanding)} EGP</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="settle-expenses">Expense claims (EGP)</FieldLabel>
                <Input id="settle-expenses" inputMode="decimal" className="text-end tabular-nums" aria-invalid={Boolean(errors.expenses)} {...register("expenses")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="settle-returned">Cash returned (EGP)</FieldLabel>
                <Input id="settle-returned" inputMode="decimal" placeholder="0.00" className="text-end tabular-nums" {...register("cash_returned")} />
              </Field>
            </div>
            {errors.expenses ? <FieldError>{errors.expenses.message}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="settle-treasury">Cash goes back to</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="settle-treasury">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {treasuries.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.code} · {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={settle.isPending}>
              Settle custody
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function WriteOffDialog({ holder, open, onOpenChange }: { holder: CustodyHolder; open: boolean; onOpenChange: (open: boolean) => void }) {
  const writeOff = useWriteOffCustody(holder.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ReasonFormValues>({ resolver: zodResolver(reasonSchema), mode: "onChange", defaultValues: { reason: "" } })

  React.useEffect(() => {
    if (open) reset({ reason: "" })
  }, [open, reset])

  const submit = ({ reason }: ReasonFormValues) =>
    writeOff.mutate(reason, {
      onSuccess: () => {
        toast.success(`${formatAmount(holder.outstanding)} EGP of ${holder.name}'s custody was written off.`)
        onOpenChange(false)
      },
      onError: (error) => toast.error(errorMessage(error, "The custody could not be written off. Try again.")),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Write off this custody?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="warning" className="text-status-warning-fg">
              Writing off charges the {formatAmount(holder.outstanding)} EGP still outstanding to expense and
              clears {holder.name}&apos;s custody. Recovering it later needs a new entry.
            </FinanceAlert>
            <Field>
              <FieldLabel htmlFor="custody-write-off-reason">Reason</FieldLabel>
              <Textarea id="custody-write-off-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || writeOff.isPending}>
              Write off
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 04.14 · Custody detail — one employee's advances, settlements and what is still out. */
function CustodyDetailPage({ holderId }: { holderId: string }) {
  const { data: holder, isError, isPending, refetch } = useCustodyHolder(holderId)
  const [settling, setSettling] = React.useState(false)
  const [writingOff, setWritingOff] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Custody" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !holder) {
    return (
      <>
        <FinancePageHeader title="Custody not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<UserX />}
            title="This employee holds no custody."
            description="Advance custody from Employee custody first."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/custody">Open Employee custody</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const open = (holder?.outstanding ?? 0) > 0

  return (
    <>
      <FinancePageHeader
        title={holder?.name ?? "Custody"}
        figure={holder ? <HeaderFigure label="Outstanding (EGP)">{formatAmount(holder.outstanding)}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/custody">Back</Link>
            </Button>
            <Button variant="ghost" disabled={!open} onClick={() => setWritingOff(true)}>
              Write off
            </Button>
            <Button variant="primary" disabled={!open} onClick={() => setSettling(true)}>
              Settle
            </Button>
          </>
        }
      />
      <FinancePageBody>
        {!holder ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Advanced (EGP)" value={formatAmount(holder.advanced)} caption={holder.role} />
              <KpiCard layout="bar" accent="teal" label="Settled (EGP)" value={formatAmount(holder.settled)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label="Outstanding (EGP)"
                value={formatAmount(holder.outstanding)}
                caption={open ? `Held since ${holder.since ? formatDate(holder.since) : "—"}` : "Cleared"}
              />
            </div>
            <FinanceSection title="Movements">
              <FinanceTable caption={`Custody movements for ${holder.name}`} columns={COLUMNS} rows={holder.movements} getRowId={(row) => row.id} />
            </FinanceSection>
            <SettleDialog holder={holder} open={settling} onOpenChange={setSettling} />
            <WriteOffDialog holder={holder} open={writingOff} onOpenChange={setWritingOff} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { CustodyDetailPage }
