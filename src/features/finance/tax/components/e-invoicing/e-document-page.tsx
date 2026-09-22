"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Printer, SearchX } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
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
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { KeyValueList } from "../../../components/shared/key-value-list"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useDocumentActions } from "../../lib/mutations/tax"
import { useEDocument } from "../../lib/queries/tax"
import type { EDocument } from "../../lib/types/tax"
import { EDocumentStatusPill } from "./e-document-status"

const cancelSchema = z.object({ reason: z.string().trim().min(1, "Give the reason the authority will see.") })
type CancelValues = z.infer<typeof cancelSchema>

const TERMINAL: Partial<Record<EDocument["status"], string>> = {
  rejected: "Rejected",
  cancel_requested: "Cancellation requested",
  cancelled: "Cancelled",
}

function Lifecycle({ doc }: { doc: EDocument }) {
  const sent = doc.status !== "not_sent"
  const cleared = ["valid", "cancel_requested", "cancelled"].includes(doc.status)
  const steps: [string, boolean][] = [
    ["Built", true],
    ["Signed", sent],
    ["Submitted", sent],
    ["Cleared", cleared],
  ]
  const terminal = TERMINAL[doc.status]
  return (
    <ol aria-label="Document lifecycle" className="flex flex-wrap items-center gap-2">
      {steps.map(([label, done], index) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-sm border px-2.5 py-0.5 text-xs leading-5",
              done ? "bg-brand-primary/10 border-brand-primary/20 text-content-primary" : "border-stroke-default text-content-tertiary",
            )}
          >
            {label}
          </span>
          {index < steps.length - 1 ? <span aria-hidden className="bg-stroke-default h-px w-6" /> : null}
        </li>
      ))}
      {terminal ? (
        <li>
          <EDocumentStatusPill status={doc.status} />
        </li>
      ) : null}
    </ol>
  )
}

/** A block pattern derived from the payload; it stands in for the authority's QR code. */
function PayloadPattern({ payload }: { payload: string }) {
  const size = 21
  const cells: [number, number][] = []
  let seed = 0
  for (const char of payload) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0
      const finder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)
      const ring = finder && (x % (size - 7) === 0 || y % (size - 7) === 0 || x % (size - 7) === 6 || y % (size - 7) === 6 || (x % (size - 7) > 1 && x % (size - 7) < 5 && y % (size - 7) > 1 && y % (size - 7) < 5))
      if (finder ? ring : (seed >>> 16) % 2 === 0) cells.push([x, y])
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="text-content-primary size-40" role="img" aria-label="Pattern standing in for the QR code">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  )
}

function PrintDialog({ doc, open, onOpenChange }: { doc: EDocument; open: boolean; onOpenChange: (open: boolean) => void }) {
  const payload = `${doc.number}|${formatDate(doc.issued)}|${doc.currency}|${doc.total.toFixed(2)}|${doc.document_uuid ? doc.document_uuid.slice(0, 16) : "unsigned"}`
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print with QR</DialogTitle>
          <DialogDescription>The authority&apos;s print layout, including the QR payload carried on the cleared document.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <KeyValueList
            items={[
              { term: "Internal ID", value: <span className="font-mono">{doc.number}</span> },
              { term: "Buyer", value: doc.buyer_name },
              { term: "Issued", value: formatDate(doc.issued) },
              { term: "Total", value: `${doc.currency} ${formatAmount(doc.total)}` },
              { term: "Document UUID", value: <span className="font-mono text-xs break-all">{doc.document_uuid ?? "—"}</span> },
            ]}
          />
          <div className="flex flex-col items-center gap-2">
            <PayloadPattern payload={payload} />
            <code className="text-content-secondary text-xs break-all">{payload}</code>
            <p className="text-content-tertiary text-center text-xs leading-4">
              The block is derived from the payload and stands in for the authority&apos;s QR. It is not a scannable code.
            </p>
          </div>
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

function CancelDialog({ doc, open, onOpenChange }: { doc: EDocument; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { cancel } = useDocumentActions(doc.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CancelValues>({ resolver: zodResolver(cancelSchema), mode: "onChange", defaultValues: { reason: "" } })
  React.useEffect(() => {
    if (open) reset({ reason: "" })
  }, [open, reset])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form
          noValidate
          onSubmit={handleSubmit(({ reason }) =>
            cancel.mutate(reason, {
              onSuccess: () => {
                toast.success(`Cancellation of ${doc.number} was requested from the authority.`)
                onOpenChange(false)
              },
              onError: (error) => toast.error(errorMessage(error, "The cancellation could not be requested. Try again.")),
            }),
          )}
        >
          <DialogHeader>
            <DialogTitle>Request cancellation with the authority?</DialogTitle>
            <DialogDescription>
              Cancellation must be requested inside the authority&apos;s window and can be refused. Until it is accepted the document
              stays valid and reportable. Issue a credit note instead if the window has passed.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <KeyValueList items={[{ term: "Internal ID", value: <span className="font-mono">{doc.number}</span> }, { term: "Date", value: formatDate(doc.issued) }]} />
            <Field>
              <FieldLabel htmlFor="cancel-reason">Reason</FieldLabel>
              <Textarea id="cancel-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || cancel.isPending}>
              Request cancellation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const FIX_COPY: Record<string, { title: string; body: string; action: string }> = {
  "4004": {
    title: "Map this item code?",
    body: "Mapping links your item to the authority's code list so documents using it pass validation. Existing rejected documents still need resubmitting. The mapping applies to every future document.",
    action: "Save mapping",
  },
  "2201": {
    title: "Recalculate the document total?",
    body: "The total is rebuilt from the line net amounts plus tax, so it matches what the authority expects. Resubmit the document afterwards.",
    action: "Recalculate",
  },
}

/** 07.04 · E-document detail — lifecycle, errors, identifiers and history, with the next action. */
function EDocumentPage({ documentId }: { documentId: string }) {
  const { data: doc, isError, isPending, refetch } = useEDocument(documentId)
  const actions = useDocumentActions(documentId)
  const [dialog, setDialog] = React.useState<"print" | "cancel" | "resubmit" | null>(null)
  const [fixing, setFixing] = React.useState<string | null>(null)
  const fail = (fallback: string) => (error: unknown) => toast.error(errorMessage(error, fallback))

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Electronic document" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }
  if (!isPending && !doc) {
    return (
      <>
        <FinancePageHeader title="Document not found" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="There is no electronic document with this number."
            description="Pick it from the e-invoicing console."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/tax/e-invoicing">Open e-invoicing</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const retryable = doc?.status === "not_sent" || doc?.status === "rejected"

  return (
    <>
      <FinancePageHeader
        title={doc?.number ?? "Electronic document"}
        figure={
          doc ? (
            <span className="flex flex-col gap-1">
              <span className="text-content-tertiary text-[13px] leading-5">{doc.authority} · E-invoice</span>
              <EDocumentStatusPill status={doc.status} />
            </span>
          ) : null
        }
        actions={
          doc ? (
            <>
              {retryable ? (
                <Button variant="primary" onClick={() => setDialog("resubmit")}>
                  Retry submission
                </Button>
              ) : null}
              {doc.status === "valid" ? (
                <Button variant="secondary" onClick={() => setDialog("cancel")}>
                  Request cancellation
                </Button>
              ) : null}
              {doc.status === "submitted" ? (
                <Button
                  variant="secondary"
                  disabled={actions.refresh.isPending}
                  onClick={() => actions.refresh.mutate(undefined, { onSuccess: () => toast.success(`${doc.number} is cleared.`), onError: fail("The status could not be refreshed. Try again.") })}
                >
                  Check status
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setDialog("print")}>
                Print with QR
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!doc ? (
          <Skeleton aria-busy aria-label="Loading document" className="h-80 rounded-xl" />
        ) : (
          <>
            <Lifecycle doc={doc} />
            <KeyValueList
              items={[
                { term: "Amount", value: <Amount value={doc.total} currency={doc.currency} align="start" /> },
                { term: "Issued", value: formatDate(doc.issued) },
                { term: "Buyer", value: doc.buyer_name },
              ]}
            />

            {doc.errors.length > 0 && doc.status === "rejected" ? (
              <FinanceSection title="Errors">
                <ul className="flex flex-col gap-2">
                  {doc.errors.map((error) => (
                    <li
                      key={error.code}
                      className={cn(
                        "bg-surface-white flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3",
                        error.fixed ? "border-stroke-default" : "border-status-danger-border",
                      )}
                    >
                      <span className="font-mono text-xs">{error.code}</span>
                      <span className="flex min-w-60 flex-1 flex-col">
                        <span className="text-content-primary text-[13px] leading-5">{error.message}</span>
                        <span className="text-content-tertiary text-xs leading-4">{error.path}</span>
                      </span>
                      {error.fixed ? (
                        <span className="text-status-success-fg text-xs leading-4 font-medium">Fixed — resubmit to clear</span>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setFixing(error.code)}>
                          Fix
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </FinanceSection>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <FinanceSection title="Identifiers">
                <dl className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border text-[13px] leading-5">
                  {[
                    ["Internal ID", doc.number],
                    ["Source document", doc.source_document],
                    ["Submission UUID", doc.submission_uuid],
                    ["Document UUID", doc.document_uuid],
                    ["Long ID", doc.long_id],
                    ["Hash", doc.hash],
                  ].map(([term, value]) => (
                    <div key={term} className="grid grid-cols-[10rem_minmax(0,1fr)] gap-4 px-4 py-2.5">
                      <dt className="text-content-secondary">{term}</dt>
                      <dd className="font-mono text-xs break-all">{value ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </FinanceSection>
              <FinanceSection title="History">
                <ol className="border-stroke-default bg-surface-white divide-stroke-light divide-y rounded-xl border">
                  {doc.history.map((event, index) => (
                    <li key={`${event.id}-${index}`} className="flex flex-col px-4 py-2.5">
                      <span className="text-content-primary text-[13px] leading-5 font-medium">{event.event}</span>
                      <span className="text-content-secondary text-xs leading-4">
                        {[event.actor, formatDate(event.date), event.note].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ol>
              </FinanceSection>
            </div>

            <PrintDialog doc={doc} open={dialog === "print"} onOpenChange={(open) => setDialog(open ? "print" : null)} />
            <CancelDialog doc={doc} open={dialog === "cancel"} onOpenChange={(open) => setDialog(open ? "cancel" : null)} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={dialog === "resubmit"} onOpenChange={(open) => setDialog(open ? "resubmit" : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resubmit this document?</AlertDialogTitle>
            <AlertDialogDescription>
              Resubmission sends the corrected document under the same internal number with a new submission reference. The earlier
              rejection stays in the history. Fix every listed error first or it will be rejected again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {doc ? (
            <KeyValueList items={[{ term: "Internal ID", value: <span className="font-mono">{doc.number}</span> }, { term: "Errors", value: doc.open_errors }]} />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                actions.submit.mutate(undefined, {
                  onSuccess: (result) =>
                    result.cleared ? toast.success(`${result.number} is cleared by the authority.`) : toast.error(`${result.number} was rejected again. Fix the listed errors first.`),
                  onError: fail("The document could not be submitted. Try again."),
                })
              }
            >
              Resubmit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(fixing)} onOpenChange={(open) => !open && setFixing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fixing ? FIX_COPY[fixing]?.title : ""}</AlertDialogTitle>
            <AlertDialogDescription>{fixing ? FIX_COPY[fixing]?.body : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <KeyValueList items={[{ term: "Errors", value: <span className="font-mono">{fixing}</span> }]} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                fixing &&
                actions.fix.mutate(fixing, {
                  onSuccess: () => toast.success("Fixed. Resubmit the document to clear it."),
                  onError: fail("The fix could not be saved. Try again."),
                })
              }
            >
              {fixing ? FIX_COPY[fixing]?.action : "Fix"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { EDocumentPage }
