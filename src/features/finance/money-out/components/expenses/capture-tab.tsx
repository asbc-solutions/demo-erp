"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
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
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { useCreateExpense } from "../../lib/mutations/payables"
import { expenseSchema, type ExpenseFormValues } from "../../lib/schema/payables"
import type { ExpenseList } from "../../lib/types/payables"
import {
  CONFIDENT_ABOVE,
  WORKED_EXAMPLE,
  suggestExpenseAccount,
} from "../../lib/utils/expense-coding"

/** The finance calendar's today; receipts default to it. */
const TODAY = "2026-03-31"
const DEFAULT_TREASURY_ID = "trs-main-cairo"

const EMPTY: ExpenseFormValues = {
  merchant: "",
  description: "",
  amount: "",
  date: TODAY,
  treasury_id: DEFAULT_TREASURY_ID,
  has_receipt: false,
  account_code: "",
}

const ROW = "md:grid md:grid-cols-[10rem_minmax(0,24rem)] md:items-center md:gap-x-4"

/**
 * 03.06 · Expenses · Capture — a receipt becomes an expense claim. The coding
 * suggestion always says why, and the entry it will post is shown before it
 * is sent for approval.
 */
function CaptureTab({ list, onSubmitted }: { list: ExpenseList; onSubmitted: () => void }) {
  const t = useTranslations("FinanceMoneyOut")
  const tCommon = useTranslations("Common")
  const { data: treasuries = [] } = useFinanceTreasuries()
  const createExpense = useCreateExpense()
  const { control, register, handleSubmit, reset, setValue } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: EMPTY,
  })

  const [merchant, description, amountText, date, treasuryId, hasReceipt, override] = useWatch({
    control,
    name: ["merchant", "description", "amount", "date", "treasury_id", "has_receipt", "account_code"],
  })

  const amount = Number(amountText) > 0 ? round2(Number(amountText)) : 0
  const started = merchant.trim() !== "" || description.trim() !== "" || amount > 0
  const suggestion = suggestExpenseAccount(merchant, description, list.accounts)
  const accountCode = override || suggestion.code
  const account = list.accounts.find((row) => row.code === accountCode)
  const treasury = treasuries.find((row) => row.id === treasuryId)
  const net = round2(amount / (1 + list.vat_rate))
  const vat = round2(amount - net)

  const blockers = [
    merchant.trim() ? null : t("errorMerchant"),
    description.trim() ? null : t("errorDescription"),
    amount > 0 ? null : t("errorAmountPaid"),
    date ? (date > TODAY ? t("blockerFutureDate") : null) : t("blockerChooseDate"),
    hasReceipt ? null : t("blockerReceipt"),
    treasury && amount > treasury.balance
      ? t("blockerTreasuryShort", {
          treasury: treasury.name,
          amount: formatAmount(treasury.balance),
          currency: treasury.currency,
        })
      : null,
  ].filter((blocker): blocker is string => blocker !== null)

  const readReceipt = () => {
    setValue("merchant", WORKED_EXAMPLE.merchant)
    setValue("description", WORKED_EXAMPLE.description)
    setValue("amount", WORKED_EXAMPLE.amount)
    setValue("account_code", "")
  }

  const submit = (values: ExpenseFormValues) =>
    createExpense.mutate(
      {
        merchant: values.merchant,
        description: values.description,
        amount,
        date: values.date,
        treasury_id: values.treasury_id,
        account_code: accountCode,
        has_receipt: values.has_receipt,
      },
      {
        onSuccess: (expense) => {
          toast.success(t("expenseSent", { number: expense.number }))
          reset(EMPTY)
          onSubmitted()
        },
        onError: (error) => toast.error(errorMessage(error, t("expenseSendFailed"))),
      },
    )

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={readReceipt}>
            {t("readReceipt")}
          </Button>
          <span className="text-content-tertiary flex items-center gap-1.5 text-[13px] leading-5">
            <Info className="size-3.5" aria-hidden />
            {t("serviceNotConnected")}
          </span>
        </div>
        <p className="text-content-tertiary max-w-xl text-[13px] leading-5">{t("extractionNote")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-merchant">{t("merchant")}</FieldLabel>
          <Input id="expense-merchant" autoComplete="off" {...register("merchant")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-description">{t("whatWasItFor")}</FieldLabel>
          <Input id="expense-description" autoComplete="off" {...register("description")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-amount">{t("amountPaid")}</FieldLabel>
          <Input id="expense-amount" inputMode="decimal" className="tabular-nums" {...register("amount")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-date">{tCommon("date")}</FieldLabel>
          <Input id="expense-date" type="date" max={TODAY} {...register("date")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-treasury">{t("paidFrom")}</FieldLabel>
          <Controller
            control={control}
            name="treasury_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="expense-treasury" className="h-9 w-full md:max-w-60">
                  <SelectValue placeholder={t("chooseTreasury")} />
                </SelectTrigger>
                <SelectContent>
                  {treasuries
                    .filter((row) => row.currency === "EGP")
                    .map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-receipt">{t("haveReceipt")}</FieldLabel>
          <Controller
            control={control}
            name="has_receipt"
            render={({ field }) => (
              <Checkbox
                id="expense-receipt"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
        </Field>
      </div>

      {started ? (
        <>
          <section
            aria-label={t("suggestedAccount")}
            className="border-stroke-default bg-surface-white flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-content-primary text-sm leading-5 font-semibold">
                {t("weSuggest", { name: suggestion.name })}
              </h3>
              <span className="text-content-secondary text-xs leading-4">
                {t("howSure", { confidence: suggestion.confidence })}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-content-secondary text-xs leading-4">{t("because")}</span>
              <p className="text-content-primary text-[13px] leading-5">
                {suggestion.reason.key === "reasonNone"
                  ? t("reasonNone")
                  : suggestion.reason.key === "reasonBoth"
                    ? t("reasonBoth", suggestion.reason.values)
                    : t(suggestion.reason.key, suggestion.reason.values)}
              </p>
            </div>
            {suggestion.confidence < CONFIDENT_ABOVE ? (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                {t("notConfident")}
              </FinanceAlert>
            ) : null}
            <Field className="max-w-60">
              <FieldLabel htmlFor="expense-account">{t("useDifferentAccount")}</FieldLabel>
              <Controller
                control={control}
                name="account_code"
                render={({ field }) => (
                  <Select value={field.value || suggestion.code} onValueChange={field.onChange}>
                    <SelectTrigger id="expense-account" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {list.accounts.map((row) => (
                        <SelectItem key={row.code} value={row.code}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </section>

          <FinanceSection title={t("beforeSubmit")}>
            {blockers.length === 0 ? (
              <p className="text-status-success-fg text-[13px] leading-5">{t("nothingInTheWay")}</p>
            ) : (
              <ul className="text-content-primary flex list-disc flex-col gap-1 ps-5 text-[13px] leading-5">
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            )}
          </FinanceSection>

          <FinanceSection title={t("entryThisBecomes")}>
            <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colLine")}</TableHead>
                    <TableHead>{t("colAccount")}</TableHead>
                    <TableHead className="text-end">{t("colDebit")}</TableHead>
                    <TableHead className="text-end">{t("colCredit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{description || t("lineExpense")}</TableCell>
                    <TableCell>
                      <span className="font-mono">{accountCode}</span> {account?.name}
                    </TableCell>
                    <TableCell className="text-end">
                      <Amount value={net} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell>{t("inputVatRate", { rate: Math.round(list.vat_rate * 100) })}</TableCell>
                    <TableCell>
                      <span className="font-mono">{list.vat_account}</span> {t("inputVat")}
                    </TableCell>
                    <TableCell className="text-end">
                      <Amount value={vat} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell>{merchant || t("linePaid")}</TableCell>
                    <TableCell>
                      <span className="font-mono">{treasury?.account_code ?? "—"}</span> {treasury?.name}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-end">
                      <Amount value={amount} />
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>{tCommon("total")}</TableCell>
                    <TableCell className="text-end">
                      <Amount value={round2(net + vat)} emphasis="strong" />
                    </TableCell>
                    <TableCell className="text-end">
                      <Amount value={amount} emphasis="strong" />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </FinanceSection>
        </>
      ) : null}

      <div>
        <Button type="submit" variant="primary" disabled={blockers.length > 0 || createExpense.isPending}>
          {t("sendForApproval")}
        </Button>
      </div>
    </form>
  )
}

export { CaptureTab }
