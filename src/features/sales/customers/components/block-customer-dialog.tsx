"use client"

import * as React from "react"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import { toastMutationError } from "../../components/shared/sales-error-state"
import { useBlockCustomer } from "../../lib/mutations/customers"
import type { CustomerListItem } from "../../lib/types"

export function BlockCustomerDialog({
  customer,
  onOpenChange,
}: Readonly<{ customer: CustomerListItem | null; onOpenChange: (open: boolean) => void }>) {
  const [reason, setReason] = React.useState("")
  const blockCustomer = useBlockCustomer()
  const isValid = reason.trim().length >= 10

  const handleConfirm = () => {
    if (!customer || !isValid) return
    blockCustomer.mutate(
      { id: customer.id, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(`${customer.name} blocked.`)
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, "Failed to block customer"),
      }
    )
  }

  return (
    <AlertDialog open={customer !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {customer?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Blocking this customer will prevent any new sales orders from being confirmed for
            their account. Existing confirmed orders and invoices are not affected. You can
            unblock them at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5 px-6 pb-6 text-left">
          <span className="text-xs font-medium text-content-secondary">Reason for blocking</span>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Payment disputes, legal hold…"
            aria-invalid={reason.length > 0 && !isValid}
          />
          {reason.length > 0 && !isValid ? (
            <span className="text-brand-danger text-xs">Reason must be at least 10 characters.</span>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="danger"
            disabled={!isValid || blockCustomer.isPending}
            onClick={handleConfirm}
          >
            {blockCustomer.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Block Customer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
