"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import type { FinanceTreasury } from "../../../lib/types/common"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { useCreateTransfer } from "../../lib/mutations/banking"
import { useTransfers } from "../../lib/queries/banking"
import { transferSchema, type TransferFormValues } from "../../lib/schema/banking"
import type { Transfer } from "../../lib/types/banking"

const TODAY = "2026-03-31"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

function historyColumns(t: BankingT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<Transfer>[] {
  return [
    { id: "number", header: t("colTransfer"), cell: (row) => <DocNumber>{row.number}</DocNumber> },
    { id: "date", header: t("colDate"), cell: (row) => formatDate(row.date) },
    {
      id: "route",
      header: t("colRoute"),
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          {row.from_name}
          <ArrowRight className="text-content-tertiary size-3.5 rtl:rotate-180" aria-label={t("to")} />
          {row.to_name}
        </span>
      ),
    },
    { id: "note", header: t("colNote"), cell: (row) => row.note || "—" },
    {
      id: "amount",
      header: t("colAmount"),
      align: "end",
      cell: (row) => <Amount value={row.amount} currency={row.currency} />,
    },
  ]
}

/** Amount in `from`'s currency restated in `to`'s, at the rates the treasuries carry. */
function received(amount: number, from?: FinanceTreasury, to?: FinanceTreasury) {
  if (!from || !to || from.currency === to.currency) return amount
  return round2((amount * from.rate) / to.rate)
}

function TreasuryField({
  id,
  label,
  value,
  onChange,
  treasuries,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  treasuries: FinanceTreasury[]
}) {
  const t = useTranslations("FinanceBanking")
  const treasury = treasuries.find((row) => row.id === value)
  return (
    <Field className="flex-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-9">
          <SelectValue placeholder={t("chooseTreasury")} />
        </SelectTrigger>
        <SelectContent>
          {treasuries.map((row) => (
            <SelectItem key={row.id} value={row.id}>
              {row.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {treasury ? (
        <FieldDescription>
          {t("balance")} <Amount value={treasury.balance} currency={treasury.currency} align="start" signed className="inline-flex" />
        </FieldDescription>
      ) : null}
    </Field>
  )
}

/** 04.09 · Transfers — move money between two treasuries as one balanced entry. */
function TransfersPage({ fromTreasuryId }: { fromTreasuryId?: string }) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const { formatDate } = useFinanceDateFormat()
  const { data: treasuries = [] } = useFinanceTreasuries()
  const { data: history } = useTransfers()
  const createTransfer = useCreateTransfer()
  const defaults: TransferFormValues = {
    from_treasury_id: fromTreasuryId ?? "bnk-cib-0021",
    to_treasury_id: fromTreasuryId === "trs-main-cairo" ? "bnk-cib-0021" : "trs-main-cairo",
    amount: "",
    date: TODAY,
    note: "",
  }
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({ resolver: zodResolver(transferSchema), defaultValues: defaults })

  const [fromId, toId, amountText] = useWatch({ control, name: ["from_treasury_id", "to_treasury_id", "amount"] })
  const from = treasuries.find((row) => row.id === fromId)
  const to = treasuries.find((row) => row.id === toId)
  const amount = Number(amountText) > 0 ? round2(Number(amountText)) : 0
  const arriving = received(amount, from, to)

  const problem =
    fromId && fromId === toId
      ? t("transferSameTreasury")
      : amount <= 0
        ? t("transferEnterAmount")
        : from && amount > from.balance
          ? t("transferShort", { name: from.name, amount: formatAmount(from.balance), currency: from.currency })
          : null

  const submit = (values: TransferFormValues) =>
    createTransfer.mutate(
      {
        from_treasury_id: values.from_treasury_id,
        to_treasury_id: values.to_treasury_id,
        amount,
        date: values.date,
        note: values.note,
      },
      {
        onSuccess: (transfer) => {
          toast.success(
            t("transferPosted", {
              number: transfer.number,
              amount: formatAmount(transfer.amount),
              currency: transfer.currency,
              from: transfer.from_name,
              to: transfer.to_name,
            }),
          )
          reset({ ...values, amount: "", note: "" })
        },
        onError: (error) => toast.error(errorMessage(error, t("transferPostFailed"))),
      },
    )

  return (
    <>
      <FinancePageHeader
        title={t("newTransfer")}
        actions={
          <Button
            type="submit"
            form="transfer-form"
            variant="primary"
            disabled={Boolean(problem) || createTransfer.isPending}
          >
            {t("postTransfer")}
          </Button>
        }
      />
      <FinancePageBody>
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <form id="transfer-form" onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <Controller
                control={control}
                name="from_treasury_id"
                render={({ field }) => (
                  <TreasuryField id="transfer-from" label={t("fromTreasury")} value={field.value} onChange={field.onChange} treasuries={treasuries} />
                )}
              />
              <ArrowRight className="text-content-tertiary mt-8 hidden size-4 shrink-0 md:block rtl:rotate-180" aria-hidden />
              <Controller
                control={control}
                name="to_treasury_id"
                render={({ field }) => (
                  <TreasuryField id="transfer-to" label={t("toTreasury")} value={field.value} onChange={field.onChange} treasuries={treasuries} />
                )}
              />
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <Field className="flex-1">
                <FieldLabel htmlFor="transfer-amount">{t("amountIn", { currency: from?.currency ?? "EGP" })}</FieldLabel>
                <Input
                  id="transfer-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.amount)}
                  {...register("amount")}
                />
                {from && to && from.currency !== to.currency && amount > 0 ? (
                  <FieldDescription>
                    {t("arrivesIn", { amount: formatAmount(arriving), currency: to.currency, name: to.name })}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="transfer-date">{tCommon("date")}</FieldLabel>
                <Input id="transfer-date" type="date" max={TODAY} {...register("date")} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="transfer-note">{t("colNote")}</FieldLabel>
              <Input id="transfer-note" placeholder={t("optionalReference")} {...register("note")} />
            </Field>
            {problem ? <FinanceAlert tone="danger">{problem}</FinanceAlert> : null}
          </form>

          <FinanceSection title={t("postingPreview")}>
            <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colDebit")}</TableHead>
                    <TableHead>{t("colCredit")}</TableHead>
                  </TableRow>
                </TableHeader>
                {amount > 0 && from && to ? (
                  <TableBody>
                    <TableRow>
                      <TableCell className="align-top">
                        <span className="flex flex-col">
                          <span className="font-mono">{to.account_code}</span>
                          <span className="text-content-secondary">{to.name}</span>
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="flex flex-col">
                          <span className="font-mono">{from.account_code}</span>
                          <span className="text-content-secondary">{from.name}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : null}
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-end">
                      <Amount value={round2(arriving * (to?.rate ?? 1))} emphasis="strong" />
                    </TableCell>
                    <TableCell className="text-end">
                      <Amount value={round2(amount * (from?.rate ?? 1))} emphasis="strong" />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <p className="text-content-tertiary text-xs leading-4">{t("transferPreviewNote")}</p>
          </FinanceSection>
        </div>

        <FinanceSection title={t("recentTransfers")}>
          <FinanceTable
            caption={t("recentTransfersCaption")}
            columns={historyColumns(t, formatDate)}
            rows={history ?? []}
            loading={!history}
            getRowId={(row) => row.id}
            empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noTransfers")}</p>}
          />
        </FinanceSection>
      </FinancePageBody>
    </>
  )
}

export { TransfersPage }
