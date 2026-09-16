"use client"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button } from "@/src/shared/components/ui/button"

import { useCancelFinanceInvoice } from "../../lib/mutations/invoices"
import type { FinanceInvoiceListItem } from "../../lib/types"
import { toastMutationError } from "../shared/finance-error-state"

export function CancelInvoiceDialog({
  invoice,
  onOpenChange,
}: Readonly<{
  invoice: FinanceInvoiceListItem | null
  onOpenChange: (open: boolean) => void
}>) {
  const cancelInvoice = useCancelFinanceInvoice()

  const handleConfirm = () => {
    if (!invoice) return
    cancelInvoice.mutate(invoice.id, {
      onSuccess: () => {
        toast.success(`${invoice.invoice_number} cancelled.`)
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to cancel invoice"),
    })
  }

  return (
    <AlertDialog open={invoice !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {invoice?.invoice_number}?</AlertDialogTitle>
          <AlertDialogDescription>
            The invoice moves to Cancelled and drops out of revenue, receivables, and aging
            totals. It stays on record for audit purposes — it isn&apos;t deleted. A fully paid
            invoice can&apos;t be cancelled; record a refund separately instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
          <Button
            type="button"
            variant="danger"
            disabled={cancelInvoice.isPending}
            onClick={handleConfirm}
          >
            {cancelInvoice.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Cancel Invoice
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
