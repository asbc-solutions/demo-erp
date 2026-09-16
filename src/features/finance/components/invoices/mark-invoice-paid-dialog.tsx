"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"

import { useMarkFinanceInvoicePaid } from "../../lib/mutations/invoices"
import type { FinanceInvoiceListItem } from "../../lib/types"
import { formatCurrency } from "../../lib/utils/currency"
import { toastMutationError } from "../shared/finance-error-state"

export function MarkInvoicePaidDialog({
  invoice,
  onOpenChange,
}: Readonly<{
  invoice: FinanceInvoiceListItem | null
  onOpenChange: (open: boolean) => void
}>) {
  const [amount, setAmount] = React.useState("")
  const [paidAt, setPaidAt] = React.useState("")
  const markPaid = useMarkFinanceInvoicePaid()

  const parsedAmount = amount.trim() === "" ? undefined : Number(amount)
  const isAmountInvalid = parsedAmount !== undefined && !(parsedAmount > 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!invoice || isAmountInvalid) return
    markPaid.mutate(
      {
        id: invoice.id,
        payload: {
          amount: parsedAmount,
          paid_at: paidAt || undefined,
        },
      },
      {
        onSuccess: (result) => {
          toast.success(
            result.status === "paid"
              ? `${invoice.invoice_number} marked as fully paid.`
              : `Payment recorded on ${invoice.invoice_number}.`,
          )
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, "Failed to record payment"),
      },
    )
  }

  return (
    <Dialog key={invoice?.id ?? "none"} open={invoice !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6" noValidate>
          <DialogTitle className="text-[18px] leading-[28.8px] font-semibold text-content-primary">
            Record Payment — {invoice?.invoice_number}
          </DialogTitle>
          <p className="text-xs leading-[18px] text-content-tertiary">
            Outstanding balance:{" "}
            <span className="font-medium text-content-primary">
              {invoice ? formatCurrency(invoice.outstanding_amount, invoice.currency_code) : "—"}
            </span>
          </p>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="mark-paid-amount"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Amount
            </Label>
            <Input
              id="mark-paid-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Leave blank to settle in full"
              aria-invalid={isAmountInvalid}
              className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] font-mono text-[13px] placeholder:text-content-quaternary"
              autoComplete="off"
            />
            {isAmountInvalid ? (
              <span className="text-brand-danger text-xs">Amount must be greater than 0.</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="mark-paid-date"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Paid Date
            </Label>
            <Input
              id="mark-paid-date"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] font-mono text-[13px]"
            />
            <p className="text-[11px] leading-[15.4px] text-content-quaternary">
              Only recorded once the full balance is settled.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isAmountInvalid || markPaid.isPending}
            className="mt-1 h-9 w-full rounded-lg text-[12px] font-normal disabled:opacity-50"
          >
            {markPaid.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Record Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
