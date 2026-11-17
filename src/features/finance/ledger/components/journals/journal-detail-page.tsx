"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Printer, SearchX, Undo2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
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
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { KeyValueList } from "../../../components/shared/key-value-list"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
  MetaChips,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useJournalAction, useReverseJournal } from "../../lib/mutations/ledger"
import { useJournal } from "../../lib/queries/ledger"
import { reverseSchema, type ReverseFormValues } from "../../lib/schema/ledger"
import type { JournalDetail, JournalLine, LedgerMessageKey } from "../../lib/types/ledger"

const TODAY = "2026-03-31"

function LinesTable({ lines, currency, caption }: { lines: JournalLine[]; currency: string; caption: string }) {
  const t = useTranslations("FinanceLedger")
  const debit = lines.reduce((sum, row) => sum + row.debit, 0)
  const credit = lines.reduce((sum, row) => sum + row.credit, 0)
  return (
    <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("account")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead className="text-end">{t("debitIn", { currency })}</TableHead>
            <TableHead className="text-end">{t("creditIn", { currency })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((row, index) => (
            <TableRow key={`${row.account_code}-${index}`}>
              <TableCell>
                <Link href={`/finance/ledger?account=${row.account_code}`} className="flex flex-col hover:underline">
                  <span className="font-mono text-xs">{row.account_code}</span>
                  <span className="text-content-secondary text-xs">{row.account_name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-content-secondary">{row.description || "—"}</TableCell>
              <TableCell className="text-end">
                <Amount value={row.debit} />
              </TableCell>
              <TableCell className="text-end">
                <Amount value={row.credit} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>{t("total")}</TableCell>
            <TableCell className="text-end">
              <Amount value={debit} emphasis="strong" />
            </TableCell>
            <TableCell className="text-end">
              <Amount value={credit} emphasis="strong" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

function ReverseDialog({ journal, open, onOpenChange }: { journal: JournalDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceLedger")
  const reverse = useReverseJournal(journal.number)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReverseFormValues>({ resolver: zodResolver(reverseSchema), defaultValues: { date: TODAY, reason: "" } })

  React.useEffect(() => {
    if (open) reset({ date: TODAY, reason: "" })
  }, [open, reset])

  const contra = journal.lines.map((row) => ({ ...row, debit: row.credit * journal.rate, credit: row.debit * journal.rate }))

  const submit = (values: ReverseFormValues) =>
    reverse.mutate(values, {
      onSuccess: (reversal) => {
        toast.success(t("toastReversed", { reversal: reversal.number, original: journal.number }))
        onOpenChange(false)
      },
      onError: (error) => toast.error(errorMessage(error, t("errorReverseEntry"))),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("reverseTitle")}</DialogTitle>
            <DialogDescription>{t("reverseDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="info">
              {t("reverseInfo", { number: journal.number })}
            </FinanceAlert>
            <Field className="max-w-48">
              <FieldLabel htmlFor="reversal-date">{t("reversalDate")}</FieldLabel>
              <Input id="reversal-date" type="date" {...register("date")} />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-content-secondary text-[13px] leading-5">{t("contraPreview")}</span>
              <LinesTable lines={contra} currency="EGP" caption={t("contraPreview")} />
            </div>
            <Field>
              <FieldLabel htmlFor="reversal-reason">{t("reason")}</FieldLabel>
              <Textarea id="reversal-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{t(errors.reason.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={reverse.isPending}>
              {t("createReversal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PrintDialog({ journal, open, onOpenChange }: { journal: JournalDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("printTitle")}</DialogTitle>
          <DialogDescription>{t("printDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <KeyValueList
            items={[
              { term: t("entryNo"), value: <span className="font-mono">{journal.number}</span> },
              { term: t("date"), value: formatDate(journal.date) },
              { term: t("description"), value: journal.description },
              { term: t("status"), value: <StatusPill status={journal.status} /> },
              { term: t("debit"), value: formatAmount(journal.debit) },
              { term: t("credit"), value: formatAmount(journal.credit) },
            ]}
          />
          <LinesTable lines={journal.lines} currency={journal.currency} caption={t("linesOf", { number: journal.number })} />
          <p className="text-content-tertiary text-[13px] leading-5">
            {t("printNote")}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer aria-hidden />
            {t("print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 05.04 · Journal entry — lines, source, audit trail; reverse, print, or move a draft along. */
function JournalDetailPage({ journalId }: { journalId: string }) {
  const t = useTranslations("FinanceLedger")
  const { formatDate, formatDateTime } = useFinanceDateFormat()
  const { data: journal, isError, isPending, refetch } = useJournal(journalId)
  const action = useJournalAction(journalId)
  const [reversing, setReversing] = React.useState(false)
  const [printing, setPrinting] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("journalEntry")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !journal) {
    return (
      <>
        <FinancePageHeader title={t("entryNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("entryNotFoundTitle")}
            description={t("entryNotFoundDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/journals">{t("openJournalEntries")}</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const run = (kind: "submit" | "post" | "send-back", done: string) =>
    action.mutate(
      { action: kind, reason: kind === "send-back" ? t("returnedForCorrection") : undefined },
      {
        onSuccess: () => toast.success(done),
        onError: (error) => toast.error(errorMessage(error, t("errorUpdateEntry"))),
      },
    )

  return (
    <>
      <FinancePageHeader
        title={journal?.number ?? t("journalEntry")}
        figure={
          journal ? (
            <HeaderFigure label={t("entryTotal")}>
              {journal.currency} {formatAmount(journal.debit)}
            </HeaderFigure>
          ) : null
        }
        actions={
          journal ? (
            <>
              {journal.status === "draft" && !journal.derived ? (
                <>
                  <Button variant="secondary" disabled={action.isPending} onClick={() => run("submit", t("toastAwaitingApproval", { number: journal.number }))}>
                    {t("submitForApproval")}
                  </Button>
                  <Button variant="primary" disabled={action.isPending} onClick={() => run("post", t("toastPosted", { number: journal.number }))}>
                    {t("post")}
                  </Button>
                </>
              ) : null}
              {journal.status === "pending" ? (
                <>
                  <Button variant="secondary" disabled={action.isPending} onClick={() => run("send-back", t("toastSentBack", { number: journal.number }))}>
                    {t("sendBack")}
                  </Button>
                  <Button variant="primary" disabled={action.isPending} onClick={() => run("post", t("toastApprovedPosted", { number: journal.number }))}>
                    {t("approveAndPost")}
                  </Button>
                </>
              ) : null}
              {journal.status === "posted" || journal.status === "reversed" ? (
                <Button variant="secondary" disabled={!journal.can_reverse} onClick={() => setReversing(true)}>
                  <Undo2 aria-hidden />
                  {journal.status === "reversed" ? t("reversed") : t("reverse")}
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => setPrinting(true)}>
                <Printer aria-hidden />
                {t("print")}
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!journal ? (
          <Skeleton aria-busy aria-label={t("loadingEntry")} className="h-96 rounded-xl" />
        ) : (
          <>
            <MetaChips>
              <StatusPill status={journal.status} />
              {journal.origin === "auto" ? <StatusPill status="origin-auto" label={t("auto")} tone="info" /> : null}
              <span>{formatDate(journal.date)}</span>
              <span>{journal.description}</span>
            </MetaChips>

            {journal.reversed_by ? (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                {t.rich("reversedByNotice", {
                  number: journal.reversed_by,
                  link: (chunks) => (
                    <Link href={`/finance/journals/${journal.reversed_by}`} className="font-mono underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </FinanceAlert>
            ) : null}
            {journal.reversal_of ? (
              <FinanceAlert tone="info">
                {t.rich(journal.reason ? "reversesNoticeWithReason" : "reversesNotice", {
                  number: journal.reversal_of,
                  reason: journal.reason ?? "",
                  link: (chunks) => (
                    <Link href={`/finance/journals/${journal.reversal_of}`} className="font-mono underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </FinanceAlert>
            ) : null}

            <FinanceSection title={t("lines")}>
              <LinesTable lines={journal.lines} currency={journal.currency} caption={t("linesOf", { number: journal.number })} />
              {journal.currency !== "EGP" ? (
                <p className="text-content-tertiary text-xs leading-4">
                  {t("baseEquivalent", { amount: formatAmount(journal.debit_base), rate: journal.rate })}
                </p>
              ) : null}
            </FinanceSection>

            {journal.origin === "auto" && journal.source ? (
              <FinanceAlert
                tone="info"
                action={
                  journal.source_href ? (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={journal.source_href}>{t("openSource", { source: journal.source })}</Link>
                    </Button>
                  ) : null
                }
              >
                {t("autoEntryNotice", { source: journal.source })}
              </FinanceAlert>
            ) : null}

            <KeyValueList
              items={[
                { term: t("source"), value: journal.source || t("manual") },
                { term: t("createdBy"), value: journal.created_by },
                {
                  term: journal.status === "pending" ? t("submitted") : t("postedBy"),
                  value:
                    journal.status === "pending"
                      ? journal.submitted_at
                        ? formatDateTime(journal.submitted_at, " · ")
                        : "—"
                      : journal.posted_by
                        ? `${journal.posted_by}${journal.posted_at ? ` · ${formatDate(journal.posted_at.slice(0, 10))}` : ""}`
                        : t("notPosted"),
                },
              ]}
            />

            <ReverseDialog journal={journal} open={reversing} onOpenChange={setReversing} />
            <PrintDialog journal={journal} open={printing} onOpenChange={setPrinting} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { JournalDetailPage, LinesTable }
