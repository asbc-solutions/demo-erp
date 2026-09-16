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

import { toastMutationError } from "../../components/shared/sales-error-state"
import { useUnblockCustomer } from "../../lib/mutations/customers"
import type { CustomerListItem } from "../../lib/types"

export function UnblockCustomerDialog({
  customer,
  onOpenChange,
}: Readonly<{ customer: CustomerListItem | null; onOpenChange: (open: boolean) => void }>) {
  const unblockCustomer = useUnblockCustomer()

  const handleConfirm = () => {
    if (!customer) return
    unblockCustomer.mutate(customer.id, {
      onSuccess: () => {
        toast.success(`${customer.name} unblocked.`)
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to unblock customer"),
    })
  }

  return (
    <AlertDialog open={customer !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unblock {customer?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This customer will be set back to Active and new sales orders can be confirmed for
            their account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="primary"
            disabled={unblockCustomer.isPending}
            onClick={handleConfirm}
          >
            {unblockCustomer.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Unblock Customer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
