"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Printer, SearchX, Undo2 } from "lucide-react"
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
import { formatDate, formatDateTime } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useJournalAction, useReverseJournal } from "../../lib/mutations/ledger"
import { useJournal } from "../../lib/queries/ledger"
import { reverseSchema, type ReverseFormValues } from "../../lib/schema/ledger"
import type { JournalDetail, JournalLine } from "../../lib/types/ledger"

const TODAY = "2026-03-31"

function LinesTable({ lines, currency, caption }: { lines: JournalLine[]; currency: string; caption: string }) {
  const debit = lines.reduce((sum, row) => sum + row.debit, 0)
  const credit = lines.reduce((sum, row) => sum + row.credit, 0)
  return (
    <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-end">Debit ({currency})</TableHead>
            <TableHead className="text-end">Credit ({currency})</TableHead>
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
            <TableCell colSpan={2}>Total</TableCell>
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
        toast.success(`${reversal.number} reverses ${journal.number}. The original stays in the ledger, marked reversed.`)
        onOpenChange(false)
      },
      onError: (error) => toast.error(errorMessage(error, "The entry could not be reversed. Try again.")),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Reverse this entry?</DialogTitle>
            <DialogDescription>
              A reversal creates a mirror entry dated today; the original stays in the ledger marked reversed.
              Reports for the original period do not change. Give a reason so the audit trail explains why.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="info">
              Reversing creates a new dated contra entry linked to {journal.number}. The original is never deleted.
            </FinanceAlert>
            <Field className="max-w-48">
              <FieldLabel htmlFor="reversal-date">Reversal date</FieldLabel>
              <Input id="reversal-date" type="date" {...register("date")} />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-content-secondary text-[13px] leading-5">Contra entry preview</span>
              <LinesTable lines={contra} currency="EGP" caption="Contra entry preview" />
            </div>
            <Field>
              <FieldLabel htmlFor="reversal-reason">Reason</FieldLabel>
              <Textarea id="reversal-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={reverse.isPending}>
              Create reversal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PrintDialog({ journal, open, onOpenChange }: { journal: JournalDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print journal entry</DialogTitle>
          <DialogDescription>A print view of the entry as it stands on the ledger.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <KeyValueList
            items={[
              { term: "Entry no.", value: <span className="font-mono">{journal.number}</span> },
              { term: "Date", value: formatDate(journal.date) },
              { term: "Description", value: journal.description },
              { term: "Status", value: <StatusPill status={journal.status} /> },
              { term: "Debit", value: formatAmount(journal.debit) },
              { term: "Credit", value: formatAmount(journal.credit) },
            ]}
          />
          <LinesTable lines={journal.lines} currency={journal.currency} caption={`Lines of ${journal.number}`} />
          <p className="text-content-tertiary text-[13px] leading-5">
            This is a print preview. The browser print dialog renders whatever is on screen — the prototype does not
            generate a stamped PDF.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer aria-hidden />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 05.04 · Journal entry — lines, source, audit trail; reverse, print, or move a draft along. */
function JournalDetailPage({ journalId }: { journalId: string }) {
  const { data: journal, isError, isPending, refetch } = useJournal(journalId)
  const action = useJournalAction(journalId)
  const [reversing, setReversing] = React.useState(false)
  const [printing, setPrinting] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Journal entry" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !journal) {
    return (
      <>
        <FinancePageHeader title="Entry not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no journal entry with this number."
            description="Check the number, or find the entry from the journal list."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/journals">Open journal entries</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const run = (kind: "submit" | "post" | "send-back", done: string) =>
    action.mutate(
      { action: kind, reason: kind === "send-back" ? "Returned for correction" : undefined },
      {
        onSuccess: () => toast.success(done),
        onError: (error) => toast.error(errorMessage(error, "The entry could not be updated. Try again.")),
      },
    )

  return (
    <>
      <FinancePageHeader
        title={journal?.number ?? "Journal entry"}
        figure={
          journal ? (
            <HeaderFigure label="Entry total">
              {journal.currency} {formatAmount(journal.debit)}
            </HeaderFigure>
          ) : null
        }
        actions={
          journal ? (
            <>
              {journal.status === "draft" && !journal.derived ? (
                <>
                  <Button variant="secondary" disabled={action.isPending} onClick={() => run("submit", `${journal.number} is waiting for approval.`)}>
                    Submit for approval
                  </Button>
                  <Button variant="primary" disabled={action.isPending} onClick={() => run("post", `${journal.number} is posted.`)}>
                    Post
                  </Button>
                </>
              ) : null}
              {journal.status === "pending" ? (
                <>
                  <Button variant="secondary" disabled={action.isPending} onClick={() => run("send-back", `${journal.number} went back to draft.`)}>
                    Send back
                  </Button>
                  <Button variant="primary" disabled={action.isPending} onClick={() => run("post", `${journal.number} is approved and posted.`)}>
                    Approve and post
                  </Button>
                </>
              ) : null}
              {journal.status === "posted" || journal.status === "reversed" ? (
                <Button variant="secondary" disabled={!journal.can_reverse} onClick={() => setReversing(true)}>
                  <Undo2 aria-hidden />
                  {journal.status === "reversed" ? "Reversed" : "Reverse"}
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => setPrinting(true)}>
                <Printer aria-hidden />
                Print
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!journal ? (
          <Skeleton aria-busy aria-label="Loading entry" className="h-96 rounded-xl" />
        ) : (
          <>
            <MetaChips>
              <StatusPill status={journal.status} />
              {journal.origin === "auto" ? <StatusPill status="origin-auto" label="Auto" tone="info" /> : null}
              <span>{formatDate(journal.date)}</span>
              <span>{journal.description}</span>
            </MetaChips>

            {journal.reversed_by ? (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                Reversed by{" "}
                <Link href={`/finance/journals/${journal.reversed_by}`} className="font-mono underline">
                  {journal.reversed_by}
                </Link>
                . The original stays in the ledger so the audit trail is complete.
              </FinanceAlert>
            ) : null}
            {journal.reversal_of ? (
              <FinanceAlert tone="info">
                This entry reverses{" "}
                <Link href={`/finance/journals/${journal.reversal_of}`} className="font-mono underline">
                  {journal.reversal_of}
                </Link>
                {journal.reason ? ` — ${journal.reason}` : ""}.
              </FinanceAlert>
            ) : null}

            <FinanceSection title="Lines">
              <LinesTable lines={journal.lines} currency={journal.currency} caption={`Lines of ${journal.number}`} />
              {journal.currency !== "EGP" ? (
                <p className="text-content-tertiary text-xs leading-4">
                  ≈ {formatAmount(journal.debit_base)} EGP @ {journal.rate}
                </p>
              ) : null}
            </FinanceSection>

            {journal.origin === "auto" && journal.source ? (
              <FinanceAlert
                tone="info"
                action={
                  journal.source_href ? (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={journal.source_href}>Open {journal.source}</Link>
                    </Button>
                  ) : null
                }
              >
                This entry was created by {journal.source}. Change the source document to change this entry — its
                lines can&apos;t be edited here.
              </FinanceAlert>
            ) : null}

            <KeyValueList
              items={[
                { term: "Source", value: journal.source || "Manual" },
                { term: "Created by", value: journal.created_by },
                {
                  term: journal.status === "pending" ? "Submitted" : "Posted by",
                  value:
                    journal.status === "pending"
                      ? journal.submitted_at
                        ? formatDateTime(journal.submitted_at, " · ")
                        : "—"
                      : journal.posted_by
                        ? `${journal.posted_by}${journal.posted_at ? ` · ${formatDate(journal.posted_at.slice(0, 10))}` : ""}`
                        : "Not posted",
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
