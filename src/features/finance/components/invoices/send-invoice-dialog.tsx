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

import { useSendFinanceInvoice } from "../../lib/mutations/invoices"
import type { FinanceInvoiceListItem } from "../../lib/types"
import { toastMutationError } from "../shared/finance-error-state"

export function SendInvoiceDialog({
  invoice,
  onOpenChange,
}: Readonly<{
  invoice: FinanceInvoiceListItem | null
  onOpenChange: (open: boolean) => void
}>) {
  const sendInvoice = useSendFinanceInvoice()

  const handleConfirm = () => {
    if (!invoice) return
    sendInvoice.mutate(invoice.id, {
      onSuccess: () => {
        toast.success(`${invoice.invoice_number} sent to the client.`)
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to send invoice"),
    })
  }

  return (
    <AlertDialog open={invoice !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send {invoice?.invoice_number}?</AlertDialogTitle>
          <AlertDialogDescription>
            This marks the invoice as sent and locks it from further edits. It will start
            counting toward receivables and invoice aging immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="primary"
            disabled={sendInvoice.isPending}
            onClick={handleConfirm}
          >
            {sendInvoice.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Send Invoice
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
