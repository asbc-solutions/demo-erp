"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { AccountSelect } from "../../../components/shared/account-select"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { useCreateJournal } from "../../lib/mutations/ledger"
import { useJournalTemplates } from "../../lib/queries/ledger"
import { journalSchema, type JournalFormValues } from "../../lib/schema/ledger"
import type { JournalTemplate, NewJournalPayload } from "../../lib/types/ledger"

const TODAY = "2026-03-31"
const EMPTY_LINE = { account_code: "", description: "", debit: "", credit: "" }

function fromTemplate(template: JournalTemplate): JournalFormValues {
  const amount = template.amount
  return {
    date: TODAY,
    description: template.name,
    lines: template.lines.map((row) => {
      const value = amount > 0 ? String(round2(amount * row.share)) : ""
      return {
        account_code: row.account_code,
        description: template.name,
        debit: row.side === "debit" ? value : "",
        credit: row.side === "credit" ? value : "",
      }
    }),
  }
}

/** New journal entry — balanced lines, saved as a draft, sent for approval, or posted. */
function JournalFormPage({ templateId }: { templateId?: string }) {
  const router = useRouter()
  const { data: templates } = useJournalTemplates()
  const create = useCreateJournal()
  const template = templates?.find((row) => row.id === templateId)
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: { date: TODAY, description: "", lines: [EMPTY_LINE, EMPTY_LINE] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  // A template arrives after the first render; fill the form from it once.
  const appliedTemplate = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (template && appliedTemplate.current !== template.id) {
      appliedTemplate.current = template.id
      reset(fromTemplate(template))
    }
  }, [template, reset])

  const lines = useWatch({ control, name: "lines" })
  const debit = round2(lines.reduce((sum, row) => sum + (Number(row.debit) || 0), 0))
  const credit = round2(lines.reduce((sum, row) => sum + (Number(row.credit) || 0), 0))
  const complete = lines.filter((row) => row.account_code && ((Number(row.debit) || 0) > 0) !== ((Number(row.credit) || 0) > 0))
  const balanced = debit > 0 && debit === credit && complete.length === lines.length
  const problem =
    debit === 0 && credit === 0
      ? null
      : debit !== credit
        ? `This entry doesn't balance. Debits total ${formatAmount(debit)} and credits ${formatAmount(credit)}. Adjust a line so both sides match, then post.`
        : complete.length !== lines.length
          ? "Every line needs an account and either a debit or a credit — not both."
          : null

  const save = (status: NewJournalPayload["status"]) =>
    handleSubmit((values) =>
      create.mutate(
        {
          date: values.date,
          description: values.description,
          status,
          lines: values.lines
            .filter((row) => row.account_code || row.debit || row.credit)
            .map((row) => ({ account_code: row.account_code, description: row.description, debit: Number(row.debit) || 0, credit: Number(row.credit) || 0 })),
        },
        {
          onSuccess: (journal) => {
            toast.success(
              status === "posted"
                ? `${journal.number} is posted.`
                : status === "pending"
                  ? `${journal.number} is waiting for approval.`
                  : `${journal.number} was saved as a draft.`,
            )
            router.push(`/finance/journals/${journal.number}`)
          },
          onError: (error) => toast.error(errorMessage(error, "The entry could not be saved. Try again.")),
        },
      ),
    )()

  return (
    <>
      <FinancePageHeader
        title={template ? `New entry from ${template.code}` : "New journal entry"}
        actions={
          <>
            <Button variant="secondary" disabled={create.isPending} onClick={() => save("draft")}>
              Save draft
            </Button>
            <Button variant="secondary" disabled={!balanced || create.isPending} onClick={() => save("pending")}>
              Submit for approval
            </Button>
            <Button variant="primary" disabled={!balanced || create.isPending} onClick={() => save("posted")}>
              Post
            </Button>
          </>
        }
      />
      <FinancePageBody>
        <form onSubmit={(event) => event.preventDefault()} noValidate className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <Field>
              <FieldLabel htmlFor="journal-date">Date</FieldLabel>
              <Input id="journal-date" type="date" {...register("date")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="journal-description">Description</FieldLabel>
              <Input id="journal-description" aria-invalid={Boolean(errors.description)} {...register("description")} />
              {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
            </Field>
          </div>

          <div className="border-stroke-default bg-surface-white overflow-x-auto rounded-lg border">
            <Table>
              <caption className="sr-only">Entry lines</caption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-80">Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-40 text-right">Debit (EGP)</TableHead>
                  <TableHead className="w-40 text-right">Credit (EGP)</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`lines.${index}.account_code`}
                        render={({ field: account }) => (
                          <AccountSelect aria-label={`Account for line ${index + 1}`} value={account.value} onValueChange={account.onChange} />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input aria-label={`Description for line ${index + 1}`} className="h-9" {...register(`lines.${index}.description`)} />
                    </TableCell>
                    <TableCell>
                      <Input aria-label={`Debit for line ${index + 1}`} inputMode="decimal" placeholder="0.00" className="h-9 text-right tabular-nums" {...register(`lines.${index}.debit`)} />
                    </TableCell>
                    <TableCell>
                      <Input aria-label={`Credit for line ${index + 1}`} inputMode="decimal" placeholder="0.00" className="h-9 text-right tabular-nums" {...register(`lines.${index}.credit`)} />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove line ${index + 1}`}
                        disabled={fields.length <= 2}
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => append(EMPTY_LINE)}>
                      <Plus aria-hidden />
                      Add line
                    </Button>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatAmount(debit)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatAmount(credit)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {problem ? <FinanceAlert tone="danger">{problem}</FinanceAlert> : null}
          {balanced ? (
            <FinanceAlert tone="success" className="text-status-success-fg">
              The entry balances. Posting writes it to the ledger; lines on a cash or bank account move that treasury too.
            </FinanceAlert>
          ) : null}
        </form>
      </FinancePageBody>
    </>
  )
}

export { JournalFormPage }
