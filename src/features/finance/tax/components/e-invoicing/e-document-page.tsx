"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Printer, SearchX } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useDocumentActions } from "../../lib/mutations/tax"
import { useEDocument } from "../../lib/queries/tax"
import type { EDocument, TaxMessageKey } from "../../lib/types/tax"
import { EDocumentStatusPill } from "./e-document-status"

/** Messages are `FinanceTax` keys, translated where the error is rendered. */
const msg = (key: TaxMessageKey) => key

const cancelSchema = z.object({ reason: z.string().trim().min(1, msg("errCancelReason")) })
type CancelValues = z.infer<typeof cancelSchema>

const TERMINAL: Partial<Record<EDocument["status"], TaxMessageKey>> = {
  rejected: "eStatusRejected",
  cancel_requested: "eStatusCancelRequested",
  cancelled: "eStatusCancelled",
}

function Lifecycle({ doc }: { doc: EDocument }) {
  const t = useTranslations("FinanceTax")
  const sent = doc.status !== "not_sent"
  const cleared = ["valid", "cancel_requested", "cancelled"].includes(doc.status)
  const steps: [TaxMessageKey, boolean][] = [
    ["stepBuilt", true],
    ["stepSigned", sent],
    ["stepSubmitted", sent],
    ["stepCleared", cleared],
  ]
  const terminal = TERMINAL[doc.status]
  return (
    <ol aria-label={t("documentLifecycle")} className="flex flex-wrap items-center gap-2">
      {steps.map(([label, done], index) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-sm border px-2.5 py-0.5 text-xs leading-5",
              done ? "bg-brand-primary/10 border-brand-primary/20 text-content-primary" : "border-stroke-default text-content-tertiary",
            )}
          >
            {t(label)}
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
  const t = useTranslations("FinanceTax")
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
    <svg viewBox={`0 0 ${size} ${size}`} className="text-content-primary size-40" role="img" aria-label={t("qrPatternLabel")}>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  )
}

function PrintDialog({ doc, open, onOpenChange }: { doc: EDocument; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const payload = `${doc.number}|${formatDate(doc.issued)}|${doc.currency}|${doc.total.toFixed(2)}|${doc.document_uuid ? doc.document_uuid.slice(0, 16) : "unsigned"}`
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("printWithQr")}</DialogTitle>
          <DialogDescription>{t("printWithQrDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <KeyValueList
            items={[
              { term: t("internalId"), value: <span className="font-mono">{doc.number}</span> },
              { term: t("buyer"), value: doc.buyer_name },
              { term: t("issued"), value: formatDate(doc.issued) },
              { term: t("total"), value: `${doc.currency} ${formatAmount(doc.total)}` },
              { term: t("documentUuid"), value: <span className="font-mono text-xs break-all">{doc.document_uuid ?? "—"}</span> },
            ]}
          />
          <div className="flex flex-col items-center gap-2">
            <PayloadPattern payload={payload} />
            <code className="text-content-secondary text-xs break-all">{payload}</code>
            <p className="text-content-tertiary text-center text-xs leading-4">
              {t("qrPatternNote")}
            </p>
          </div>
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

function CancelDialog({ doc, open, onOpenChange }: { doc: EDocument; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
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
                toast.success(t("toastCancelRequested", { number: doc.number }))
                onOpenChange(false)
              },
              onError: (error) => toast.error(errorMessage(error, t("errorRequestCancel"))),
            }),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("requestCancelTitle")}</DialogTitle>
            <DialogDescription>{t("requestCancelDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <KeyValueList items={[{ term: t("internalId"), value: <span className="font-mono">{doc.number}</span> }, { term: t("date"), value: formatDate(doc.issued) }]} />
            <Field>
              <FieldLabel htmlFor="cancel-reason">{t("reason")}</FieldLabel>
              <Textarea id="cancel-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{t(errors.reason.message as TaxMessageKey)}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || cancel.isPending}>
              {t("requestCancellation")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const FIX_COPY: Record<string, { title: TaxMessageKey; body: TaxMessageKey; action: TaxMessageKey }> = {
  "4004": { title: "fix4004Title", body: "fix4004Body", action: "fix4004Action" },
  "2201": { title: "fix2201Title", body: "fix2201Body", action: "fix2201Action" },
}

/** 07.04 · E-document detail — lifecycle, errors, identifiers and history, with the next action. */
function EDocumentPage({ documentId }: { documentId: string }) {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const { data: doc, isError, isPending, refetch } = useEDocument(documentId)
  const actions = useDocumentActions(documentId)
  const [dialog, setDialog] = React.useState<"print" | "cancel" | "resubmit" | null>(null)
  const [fixing, setFixing] = React.useState<string | null>(null)
  const fail = (fallback: string) => (error: unknown) => toast.error(errorMessage(error, fallback))

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("electronicDocument")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }
  if (!isPending && !doc) {
    return (
      <>
        <FinancePageHeader title={t("documentNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("documentNotFoundTitle")}
            description={t("documentNotFoundDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/tax/e-invoicing">{t("openEInvoicing")}</Link>
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
        title={doc?.number ?? t("electronicDocument")}
        figure={
          doc ? (
            <span className="flex flex-col gap-1">
              <span className="text-content-tertiary text-[13px] leading-5">{t("authorityEInvoice", { authority: doc.authority })}</span>
              <EDocumentStatusPill status={doc.status} />
            </span>
          ) : null
        }
        actions={
          doc ? (
            <>
              {retryable ? (
                <Button variant="primary" onClick={() => setDialog("resubmit")}>
                  {t("retrySubmission")}
                </Button>
              ) : null}
              {doc.status === "valid" ? (
                <Button variant="secondary" onClick={() => setDialog("cancel")}>
                  {t("requestCancellation")}
                </Button>
              ) : null}
              {doc.status === "submitted" ? (
                <Button
                  variant="secondary"
                  disabled={actions.refresh.isPending}
                  onClick={() => actions.refresh.mutate(undefined, { onSuccess: () => toast.success(t("toastCleared", { number: doc.number })), onError: fail(t("errorRefreshStatus")) })}
                >
                  {t("checkStatus")}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setDialog("print")}>
                {t("printWithQr")}
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!doc ? (
          <Skeleton aria-busy aria-label={t("loadingDocument")} className="h-80 rounded-xl" />
        ) : (
          <>
            <Lifecycle doc={doc} />
            <KeyValueList
              items={[
                { term: t("amount"), value: <Amount value={doc.total} currency={doc.currency} align="start" /> },
                { term: t("issued"), value: formatDate(doc.issued) },
                { term: t("buyer"), value: doc.buyer_name },
              ]}
            />

            {doc.errors.length > 0 && doc.status === "rejected" ? (
              <FinanceSection title={t("errors")}>
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
                        <span className="text-status-success-fg text-xs leading-4 font-medium">{t("fixedResubmit")}</span>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setFixing(error.code)}>
                          {t("fix")}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </FinanceSection>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <FinanceSection title={t("identifiers")}>
                <dl className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border text-[13px] leading-5">
                  {[
                    [t("internalId"), doc.number],
                    [t("sourceDocument"), doc.source_document],
                    [t("submissionUuid"), doc.submission_uuid],
                    [t("documentUuid"), doc.document_uuid],
                    [t("longId"), doc.long_id],
                    [t("hash"), doc.hash],
                  ].map(([term, value]) => (
                    <div key={term} className="grid grid-cols-[10rem_minmax(0,1fr)] gap-4 px-4 py-2.5">
                      <dt className="text-content-secondary">{term}</dt>
                      <dd className="font-mono text-xs break-all">{value ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </FinanceSection>
              <FinanceSection title={t("history")}>
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
            <AlertDialogTitle>{t("resubmitTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resubmitDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          {doc ? (
            <KeyValueList items={[{ term: t("internalId"), value: <span className="font-mono">{doc.number}</span> }, { term: t("errors"), value: doc.open_errors }]} />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                actions.submit.mutate(undefined, {
                  onSuccess: (result) =>
                    result.cleared ? toast.success(t("toastClearedByAuthority", { number: result.number })) : toast.error(t("toastRejectedAgain", { number: result.number })),
                  onError: fail(t("errorSubmitDocument")),
                })
              }
            >
              {t("resubmit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(fixing)} onOpenChange={(open) => !open && setFixing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fixing && FIX_COPY[fixing] ? t(FIX_COPY[fixing].title) : ""}</AlertDialogTitle>
            <AlertDialogDescription>{fixing && FIX_COPY[fixing] ? t(FIX_COPY[fixing].body) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <KeyValueList items={[{ term: t("errors"), value: <span className="font-mono">{fixing}</span> }]} />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                fixing &&
                actions.fix.mutate(fixing, {
                  onSuccess: () => toast.success(t("toastFixed")),
                  onError: fail(t("errorSaveFix")),
                })
              }
            >
              {fixing && FIX_COPY[fixing] ? t(FIX_COPY[fixing].action) : t("fix")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { EDocumentPage }
