"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
import type { JournalTemplate, LedgerMessageKey, NewJournalPayload } from "../../lib/types/ledger"

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
  const t = useTranslations("FinanceLedger")
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
        ? t("entryUnbalanced", { debit: formatAmount(debit), credit: formatAmount(credit) })
        : complete.length !== lines.length
          ? t("entryLineIncomplete")
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
                ? t("toastPosted", { number: journal.number })
                : status === "pending"
                  ? t("toastAwaitingApproval", { number: journal.number })
                  : t("toastSavedDraft", { number: journal.number }),
            )
            router.push(`/finance/journals/${journal.number}`)
          },
          onError: (error) => toast.error(errorMessage(error, t("errorSaveEntry"))),
        },
      ),
    )()

  return (
    <>
      <FinancePageHeader
        title={template ? t("newEntryFromTemplate", { code: template.code }) : t("newJournalEntry")}
        actions={
          <>
            <Button variant="secondary" disabled={create.isPending} onClick={() => save("draft")}>
              {t("saveDraft")}
            </Button>
            <Button variant="secondary" disabled={!balanced || create.isPending} onClick={() => save("pending")}>
              {t("submitForApproval")}
            </Button>
            <Button variant="primary" disabled={!balanced || create.isPending} onClick={() => save("posted")}>
              {t("post")}
            </Button>
          </>
        }
      />
      <FinancePageBody>
        <form onSubmit={(event) => event.preventDefault()} noValidate className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <Field>
              <FieldLabel htmlFor="journal-date">{t("date")}</FieldLabel>
              <Input id="journal-date" type="date" {...register("date")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="journal-description">{t("description")}</FieldLabel>
              <Input id="journal-description" aria-invalid={Boolean(errors.description)} {...register("description")} />
              {errors.description ? <FieldError>{t(errors.description.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
          </div>

          <div className="border-stroke-default bg-surface-white overflow-x-auto rounded-lg border">
            <Table>
              <caption className="sr-only">{t("entryLines")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-80">{t("account")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead className="w-40 text-end">{t("debitEgp")}</TableHead>
                  <TableHead className="w-40 text-end">{t("creditEgp")}</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">{t("remove")}</span>
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
                          <AccountSelect aria-label={t("lineAccount", { line: index + 1 })} value={account.value} onValueChange={account.onChange} />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input aria-label={t("lineDescription", { line: index + 1 })} className="h-9" {...register(`lines.${index}.description`)} />
                    </TableCell>
                    <TableCell>
                      <Input aria-label={t("lineDebit", { line: index + 1 })} inputMode="decimal" placeholder="0.00" className="h-9 text-end tabular-nums" {...register(`lines.${index}.debit`)} />
                    </TableCell>
                    <TableCell>
                      <Input aria-label={t("lineCredit", { line: index + 1 })} inputMode="decimal" placeholder="0.00" className="h-9 text-end tabular-nums" {...register(`lines.${index}.credit`)} />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("lineRemove", { line: index + 1 })}
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
                      {t("addLine")}
                    </Button>
                  </TableCell>
                  <TableCell className="text-end font-semibold tabular-nums">{formatAmount(debit)}</TableCell>
                  <TableCell className="text-end font-semibold tabular-nums">{formatAmount(credit)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {problem ? <FinanceAlert tone="danger">{problem}</FinanceAlert> : null}
          {balanced ? (
            <FinanceAlert tone="success" className="text-status-success-fg">
              {t("entryBalances")}
            </FinanceAlert>
          ) : null}
        </form>
      </FinancePageBody>
    </>
  )
}

export { JournalFormPage }
