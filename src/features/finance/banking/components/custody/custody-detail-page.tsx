"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserX } from "lucide-react"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useSettleCustody, useWriteOffCustody } from "../../lib/mutations/banking"
import { useCustodyHolder } from "../../lib/queries/banking"
import {
  reasonSchema,
  settleSchema,
  type BankingErrorKey,
  type ReasonFormValues,
  type SettleFormValues,
} from "../../lib/schema/banking"
import type { CustodyHolder, CustodyMovementType } from "../../lib/types/banking"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

/** Pill tone per movement; the label is the `FinanceBanking` enum map `custodyType`. */
const TYPE_TONE: Record<CustodyMovementType, StatusTone> = {
  advance: "info",
  settle: "success",
  return: "neutral",
  write_off: "danger",
}

function movementColumns(t: BankingT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<CustodyHolder["movements"][number]>[] {
  return [
    { id: "date", header: t("colDate"), cell: (row) => formatDate(row.date) },
    {
      id: "memo",
      header: t("colMemo"),
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          {row.memo}
          <StatusPill status={`custody-${row.type}`} label={t(`custodyType.${row.type}`)} tone={TYPE_TONE[row.type]} />
        </span>
      ),
    },
    { id: "amount", header: t("amountEgp"), align: "end", cell: (row) => <Amount value={row.amount} /> },
  ]
}

function SettleDialog({ holder, open, onOpenChange }: { holder: CustodyHolder; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
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
              ? t("stillHolds", { name: updated.name, amount: formatAmount(updated.outstanding) })
              : t("custodyCleared", { name: updated.name }),
          )
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, t("settleFailed"))),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("settleTitle")}</DialogTitle>
            <DialogDescription>{t("settleDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-content-secondary text-[13px] leading-5">
              {t.rich("outstandingLine", {
                amount: formatAmount(holder.outstanding),
                value: (chunks) => <span className="text-content-primary font-medium tabular-nums">{chunks}</span>,
              })}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="settle-expenses">{t("expenseClaimsEgp")}</FieldLabel>
                <Input id="settle-expenses" inputMode="decimal" className="text-end tabular-nums" aria-invalid={Boolean(errors.expenses)} {...register("expenses")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="settle-returned">{t("cashReturnedEgp")}</FieldLabel>
                <Input id="settle-returned" inputMode="decimal" placeholder="0.00" className="text-end tabular-nums" {...register("cash_returned")} />
              </Field>
            </div>
            {errors.expenses?.message ? <FieldError>{t(errors.expenses.message as BankingErrorKey)}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="settle-treasury">{t("cashGoesBackTo")}</FieldLabel>
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
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={settle.isPending}>
              {t("settleCustody")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function WriteOffDialog({ holder, open, onOpenChange }: { holder: CustodyHolder; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
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
        toast.success(t("custodyWrittenOff", { amount: formatAmount(holder.outstanding), name: holder.name }))
        onOpenChange(false)
      },
      onError: (error) => toast.error(errorMessage(error, t("custodyWriteOffFailed"))),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("custodyWriteOffTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="warning" className="text-status-warning-fg">
              {t("custodyWriteOffExplainer", { amount: formatAmount(holder.outstanding), name: holder.name })}
            </FinanceAlert>
            <Field>
              <FieldLabel htmlFor="custody-write-off-reason">{t("reason")}</FieldLabel>
              <Textarea id="custody-write-off-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason?.message ? <FieldError>{t(errors.reason.message as BankingErrorKey)}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || writeOff.isPending}>
              {t("writeOff")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 04.14 · Custody detail — one employee's advances, settlements and what is still out. */
function CustodyDetailPage({ holderId }: { holderId: string }) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const { formatDate } = useFinanceDateFormat()
  const { data: holder, isError, isPending, refetch } = useCustodyHolder(holderId)
  const [settling, setSettling] = React.useState(false)
  const [writingOff, setWritingOff] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("custody")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !holder) {
    return (
      <>
        <FinancePageHeader title={t("custodyNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<UserX />}
            title={t("noCustodyHeld")}
            description={t("noCustodyHeldDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/custody">{t("openEmployeeCustody")}</Link>
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
        title={holder?.name ?? t("custody")}
        figure={holder ? <HeaderFigure label={t("outstandingEgp")}>{formatAmount(holder.outstanding)}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/custody">{tCommon("back")}</Link>
            </Button>
            <Button variant="ghost" disabled={!open} onClick={() => setWritingOff(true)}>
              {t("writeOff")}
            </Button>
            <Button variant="primary" disabled={!open} onClick={() => setSettling(true)}>
              {t("settle")}
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
              <KpiCard layout="bar" accent="indigo" label={t("advancedEgp")} value={formatAmount(holder.advanced)} caption={holder.role} />
              <KpiCard layout="bar" accent="teal" label={t("settledEgp")} value={formatAmount(holder.settled)} />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("outstandingEgp")}
                value={formatAmount(holder.outstanding)}
                caption={
                  open
                    ? t("heldSince", { date: holder.since ? formatDate(holder.since) : "—" })
                    : t("clearedCaption")
                }
              />
            </div>
            <FinanceSection title={t("movements")}>
              <FinanceTable
                caption={t("custodyMovementsFor", { name: holder.name })}
                columns={movementColumns(t, formatDate)}
                rows={holder.movements}
                getRowId={(row) => row.id}
              />
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
