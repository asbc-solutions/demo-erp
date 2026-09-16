"use client"

import * as React from "react"
import { ArrowLeft, Download, Loader2, Plus, Printer, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState, toastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner, SalesSectionSpinner } from "../../components/shared/sales-loading"
import { formatCurrency } from "../../lib/utils/currency"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import {
  useCancelInvoice,
  useCloseInvoice,
  useInvoicePdf,
  useInvoicePrintUrl,
  useMarkInvoiceSent,
  usePostInvoice,
} from "../../lib/mutations/invoices"
import { useRecordPayment, useVoidPayment } from "../../lib/mutations/payments"
import { useInvoice } from "../../lib/queries/invoices"
import {
  MasterDataSelect,
  SALES_SELECT_CLASS_NAME,
  useMasterDataEntry,
} from "../../components/shared/master-data-select"
import { useInvoicePayments } from "../../lib/queries/payments"
import type { Invoice, InvoiceStatus } from "../../lib/types"
import { InvoiceNumber } from "./invoice-number"

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft: "bg-surface-hover text-content-secondary",
  posted: "bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300",
  sent: "bg-violet-400/15 text-violet-500 dark:bg-violet-400/20 dark:text-violet-300",
  closed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-950/45 dark:text-red-300",
}

function StatusBadge({ status, label }: Readonly<{ status: InvoiceStatus; label: string }>) {
  return (
    <Badge variant="neutral" className={cn("rounded-full px-3 font-normal", STATUS_STYLE[status])}>
      {label}
    </Badge>
  )
}

function LinesCard({ invoice }: Readonly<{ invoice: Invoice }>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-[900px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5">Description</TableHead>
            <TableHead className="w-[90px] text-right">Qty</TableHead>
            <TableHead className="w-[120px] text-right">Unit Price</TableHead>
            <TableHead className="w-[90px] text-right">Tax</TableHead>
            <TableHead className="w-[130px] px-5 text-right">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.lines.length ? (
            invoice.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="px-5 py-3 font-medium text-content-primary">{line.description}</TableCell>
                <TableCell className="py-3 text-right">{line.quantity}</TableCell>
                <TableCell className="py-3 text-right">{formatCurrency(line.unit_price)}</TableCell>
                <TableCell className="py-3 text-right">{line.tax_percent}%</TableCell>
                <TableCell className="px-5 py-3 text-right font-semibold">
                  {formatCurrency(line.line_total)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-content-tertiary">
                No line items.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col items-end gap-1 border-t border-stroke-light px-5 py-4 text-sm">
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>Subtotal</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>Tax</span>
          <span>{formatCurrency(invoice.tax_total)}</span>
        </div>
        <div className="flex w-56 justify-between text-base font-bold text-content-primary">
          <span>Total Due</span>
          <span>{formatCurrency(invoice.total_due)}</span>
        </div>
        <div className="flex w-56 justify-between text-content-tertiary">
          <span>Amount Paid</span>
          <span>{formatCurrency(invoice.amount_paid)}</span>
        </div>
        <div className="flex w-56 justify-between font-semibold text-brand-primary">
          <span>Remaining Due</span>
          <span>{formatCurrency(invoice.remaining_due)}</span>
        </div>
      </div>
    </div>
  )
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; invoice: Invoice }>) {
  const recordPayment = useRecordPayment()

  const [paymentMethodId, setPaymentMethodId] = React.useState("")
  const selectedPaymentMethod = useMasterDataEntry("payment_methods", paymentMethodId)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    recordPayment.mutate(
      {
        invoiceId: invoice.id,
        payload: {
          amount: Number.parseFloat(String(formData.get("amount") ?? "0")) || 0,
          payment_method_id: paymentMethodId,
          reference: String(formData.get("reference") ?? "").trim() || undefined,
          paid_at: String(formData.get("paidAt")),
          note: String(formData.get("note") ?? "").trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded")
          onOpenChange(false)
          setPaymentMethodId("")
        },
        onError: (err) => toastMutationError(err, "Failed to record payment"),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setPaymentMethodId("")
      }}
    >
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                Amount (remaining: {formatCurrency(invoice.remaining_due)})
              </span>
              <Input
                name="amount"
                type="number"
                min="0.01"
                max={invoice.remaining_due}
                step="0.01"
                required
                autoFocus
              />
            </label>
            <MasterDataSelect
              field="payment_methods"
              name="paymentMethod"
              label="Payment method"
              value={paymentMethodId}
              onValueChange={setPaymentMethodId}
              placeholder="Select a method…"
              emptyMessage="No payment methods are configured yet, so payments can’t be recorded. Ask an administrator to add them to the sales master data."
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">Paid on</span>
              <Input name="paidAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                {selectedPaymentMethod?.requires_reference ? (
                  <>
                    Reference <span className="text-brand-danger">*</span>
                  </>
                ) : (
                  "Reference (optional)"
                )}
              </span>
              <Input
                name="reference"
                placeholder="Check / transfer number"
                required={selectedPaymentMethod?.requires_reference ?? false}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">Note (optional)</span>
              <Textarea name="note" />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={recordPayment.isPending || !paymentMethodId}
            >
              {recordPayment.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PaymentsSection({ invoice }: Readonly<{ invoice: Invoice }>) {
  const { data: payments, isLoading, isError, refetch } = useInvoicePayments(invoice.id)
  const [recordOpen, setRecordOpen] = React.useState(false)
  const [voidingId, setVoidingId] = React.useState<string | null>(null)
  const voidPayment = useVoidPayment()

  const canRecord = invoice.status === "posted" || invoice.status === "sent"

  const handleVoid = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!voidingId) return
    const reason = String(new FormData(event.currentTarget).get("voidReason") ?? "").trim()
    voidPayment.mutate(
      { paymentId: voidingId, invoiceId: invoice.id, payload: { void_reason: reason } },
      {
        onSuccess: () => {
          toast.success("Payment voided")
          setVoidingId(null)
        },
        onError: (err) => toastMutationError(err, "Failed to void payment"),
      },
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content-primary">Payments</h2>
        {canRecord && invoice.remaining_due > 0 ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => setRecordOpen(true)}>
            <Plus aria-hidden />
            Record Payment
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <SalesSectionSpinner />
      ) : isError ? (
        <SalesErrorState message="Failed to load payments." onRetry={() => void refetch()} />
      ) : (
        <div className="flex flex-col divide-y divide-stroke-light rounded-2xl border border-stroke-default bg-surface-white">
          {payments && payments.length > 0 ? (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className={cn("font-medium text-content-primary", payment.is_voided && "line-through opacity-60")}>
                    {formatCurrency(payment.amount)} — {payment.payment_method_name ?? "Payment"}
                  </span>
                  <span className="text-xs text-content-tertiary">
                    {payment.paid_at}
                    {payment.reference ? ` · Ref: ${payment.reference}` : ""}
                  </span>
                  {payment.is_voided ? (
                    <span className="text-xs text-brand-danger">Voided{payment.void_reason ? `: ${payment.void_reason}` : ""}</span>
                  ) : null}
                </div>
                {!payment.is_voided ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Void payment"
                    className="text-brand-danger"
                    onClick={() => setVoidingId(payment.id)}
                  >
                    <XCircle aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="px-5 py-6 text-center text-xs text-content-tertiary">No payments recorded yet.</p>
          )}
        </div>
      )}

      <RecordPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} invoice={invoice} />

      <Dialog open={voidingId !== null} onOpenChange={(open) => !open && setVoidingId(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleVoid}>
            <DialogHeader>
              <DialogTitle>Void payment</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">Reason</span>
                <Textarea name="voidReason" required autoFocus />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setVoidingId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={voidPayment.isPending}>
                Void payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ActionBar({ invoice, onBack }: Readonly<{ invoice: Invoice; onBack: () => void }>) {
  const [sentOpen, setSentOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const postInvoice = usePostInvoice()
  const markSent = useMarkInvoiceSent()
  const closeInvoice = useCloseInvoice()
  const cancelInvoice = useCancelInvoice()
  const getPdf = useInvoicePdf()
  const getPrintUrl = useInvoicePrintUrl()
  const { can } = usePermissions()

  const canCancel = invoice.status === "draft" || invoice.status === "posted" || invoice.status === "sent"

  const handlePost = () => {
    postInvoice.mutate(invoice.id, {
      onSuccess: () => toast.success("Invoice posted"),
      onError: (err) => toastMutationError(err, "Failed to post invoice"),
    })
  }

  const handleClose = () => {
    closeInvoice.mutate(invoice.id, {
      onSuccess: () => toast.success("Invoice closed"),
      onError: (err) => toastMutationError(err, "Failed to close invoice — it may not be fully paid yet"),
    })
  }

  const handlePdf = () => {
    getPdf.mutate(
      { id: invoice.id },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, "Failed to generate PDF"),
      },
    )
  }

  const handlePrint = () => {
    getPrintUrl.mutate(
      { id: invoice.id },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, "Failed to open print view"),
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden />
        Back
      </Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {can.write(SALES_RESOURCES.invoice) ? (
          <>
            {invoice.status === "draft" ? (
              <Button type="button" variant="primary" disabled={postInvoice.isPending} onClick={handlePost}>
                {postInvoice.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Post
              </Button>
            ) : null}
            {invoice.status === "posted" ? (
              <Button type="button" variant="primary" onClick={() => setSentOpen(true)}>
                Mark Sent
              </Button>
            ) : null}
            {invoice.status === "sent" ? (
              <Button type="button" variant="primary" disabled={closeInvoice.isPending} onClick={handleClose}>
                {closeInvoice.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Close
              </Button>
            ) : null}
            {canCancel ? (
              <Button type="button" variant="secondary" onClick={() => setCancelOpen(true)}>
                Cancel Invoice
              </Button>
            ) : null}
          </>
        ) : null}
        <Button type="button" variant="secondary" disabled={getPrintUrl.isPending} onClick={handlePrint}>
          {getPrintUrl.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Printer aria-hidden />}
          Print
        </Button>
        <Button type="button" variant="secondary" disabled={getPdf.isPending} onClick={handlePdf}>
          {getPdf.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download aria-hidden />}
          PDF
        </Button>
      </div>

      <Dialog open={sentOpen} onOpenChange={setSentOpen}>
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const sentVia = String(new FormData(event.currentTarget).get("sentVia")) as "email" | "whatsapp" | "manual"
              markSent.mutate(
                { id: invoice.id, payload: { sent_via: sentVia } },
                {
                  onSuccess: () => {
                    toast.success("Invoice marked as sent")
                    setSentOpen(false)
                  },
                  onError: (err) => toastMutationError(err, "Failed to mark invoice as sent"),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>Mark invoice sent</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">Sent via</span>
                <select name="sentVia" className={SALES_SELECT_CLASS_NAME} defaultValue="email">
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="manual">Manual</option>
                </select>
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setSentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={markSent.isPending}>
                Mark Sent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim()
              cancelInvoice.mutate(
                { id: invoice.id, payload: { cancellation_reason: reason } },
                {
                  onSuccess: () => {
                    toast.success("Invoice cancelled")
                    setCancelOpen(false)
                  },
                  onError: (err) =>
                    toastMutationError(err, "Failed to cancel invoice — void any active payments first"),
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>Cancel invoice</DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <p className="text-xs text-content-tertiary">
                Blocked if this invoice has any active (non-voided) payments — void them first.
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-content-secondary">Reason</span>
                <Textarea name="reason" required autoFocus />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCancelOpen(false)}>
                Keep invoice
              </Button>
              <Button type="submit" variant="danger" disabled={cancelInvoice.isPending}>
                Cancel invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function InvoiceDetailView({
  invoiceId,
  onBack,
}: Readonly<{ invoiceId: string; onBack: () => void }>) {
  const { data: invoice, isLoading, isError, refetch } = useInvoice(invoiceId)

  if (isLoading) return <SalesPageSpinner />
  if (isError || !invoice) {
    return <SalesErrorState message="Failed to load invoice." onRetry={() => void refetch()} />
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <ActionBar invoice={invoice} onBack={onBack} />

      <Card variant="elevated" className="rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-content-primary">
                <InvoiceNumber value={invoice.number} status={invoice.status} />
              </h1>
              <StatusBadge status={invoice.status} label={invoice.status_label} />
            </div>
            <p className="text-sm text-content-secondary">{invoice.customer_name}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-content-quaternary">Invoice Date</p>
            <p className="font-mono font-medium text-content-primary">{invoice.invoice_date}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">Due Date</p>
            <p className="font-mono font-medium text-content-primary">{invoice.due_date}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">Payment Status</p>
            <p className="font-medium text-content-primary">{invoice.payment_status_label}</p>
          </div>
          <div>
            <p className="text-xs text-content-quaternary">Remaining Due</p>
            <p className="font-medium text-content-primary">{formatCurrency(invoice.remaining_due)}</p>
          </div>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-content-primary">Line Items</h2>
      <LinesCard invoice={invoice} />

      <PaymentsSection invoice={invoice} />
    </div>
  )
}
