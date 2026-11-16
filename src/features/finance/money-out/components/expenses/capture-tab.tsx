"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
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
    merchant.trim() ? null : "Enter the merchant.",
    description.trim() ? null : "Say what it was for.",
    amount > 0 ? null : "Enter the amount paid.",
    date ? (date > TODAY ? "The date is after today. Use the date on the receipt." : null) : "Choose the date.",
    hasReceipt ? null : "Confirm you have the receipt. An expense without one cannot be approved.",
    treasury && amount > treasury.balance
      ? `${treasury.name} holds ${formatAmount(treasury.balance)} ${treasury.currency}, less than this expense.`
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
          toast.success(`${expense.number} was sent for approval.`)
          reset(EMPTY)
          onSubmitted()
        },
        onError: (error) => toast.error(errorMessage(error, "The expense could not be sent. Try again.")),
      },
    )

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={readReceipt}>
            Read the receipt
          </Button>
          <span className="text-content-tertiary flex items-center gap-1.5 text-[13px] leading-5">
            <Info className="size-3.5" aria-hidden />
            Needs a service that is not connected.
          </span>
        </div>
        <p className="text-content-tertiary max-w-xl text-[13px] leading-5">
          Extraction is not connected in this build, so the fields below are filled with a worked example
          rather than read from your image. Everything after that step is real.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-merchant">Merchant</FieldLabel>
          <Input id="expense-merchant" autoComplete="off" {...register("merchant")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-description">What was it for</FieldLabel>
          <Input id="expense-description" autoComplete="off" {...register("description")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-amount">Amount paid</FieldLabel>
          <Input id="expense-amount" inputMode="decimal" className="tabular-nums" {...register("amount")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-date">Date</FieldLabel>
          <Input id="expense-date" type="date" max={TODAY} {...register("date")} />
        </Field>
        <Field className={ROW}>
          <FieldLabel htmlFor="expense-treasury">Paid from</FieldLabel>
          <Controller
            control={control}
            name="treasury_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="expense-treasury" className="h-9 w-full md:max-w-60">
                  <SelectValue placeholder="Choose a treasury" />
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
          <FieldLabel htmlFor="expense-receipt">I have the receipt</FieldLabel>
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
            aria-label="Suggested account"
            className="border-stroke-default bg-surface-white flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-content-primary text-sm leading-5 font-semibold">
                We suggest: {suggestion.name}
              </h3>
              <span className="text-content-secondary text-xs leading-4">How sure: {suggestion.confidence}%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-content-secondary text-xs leading-4">Because</span>
              <p className="text-content-primary text-[13px] leading-5">{suggestion.reason}</p>
            </div>
            {suggestion.confidence < CONFIDENT_ABOVE ? (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                We are not confident about this one. Check the account before you submit.
              </FinanceAlert>
            ) : null}
            <Field className="max-w-60">
              <FieldLabel htmlFor="expense-account">Use a different account</FieldLabel>
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

          <FinanceSection title="Before this can be submitted">
            {blockers.length === 0 ? (
              <p className="text-status-success-fg text-[13px] leading-5">Nothing is in the way.</p>
            ) : (
              <ul className="text-content-primary flex list-disc flex-col gap-1 ps-5 text-[13px] leading-5">
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            )}
          </FinanceSection>

          <FinanceSection title="The entry this becomes">
            <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead>Line</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-end">Debit</TableHead>
                    <TableHead className="text-end">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{description || "Expense"}</TableCell>
                    <TableCell>
                      <span className="font-mono">{accountCode}</span> {account?.name}
                    </TableCell>
                    <TableCell className="text-end">
                      <Amount value={net} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell>Input VAT {Math.round(list.vat_rate * 100)}%</TableCell>
                    <TableCell>
                      <span className="font-mono">{list.vat_account}</span> Input VAT
                    </TableCell>
                    <TableCell className="text-end">
                      <Amount value={vat} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell>{merchant || "Paid"}</TableCell>
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
                    <TableCell colSpan={2}>Total</TableCell>
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
          Send for approval
        </Button>
      </div>
    </form>
  )
}

export { CaptureTab }
