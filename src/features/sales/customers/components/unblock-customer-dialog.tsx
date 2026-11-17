"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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

import { useToastMutationError } from "../../components/shared/sales-error-state"
import { useUnblockCustomer } from "../../lib/mutations/customers"
import type { CustomerListItem } from "../../lib/types"

export function UnblockCustomerDialog({
  customer,
  onOpenChange,
}: Readonly<{ customer: CustomerListItem | null; onOpenChange: (open: boolean) => void }>) {
  const t = useTranslations("SalesCustomers")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const unblockCustomer = useUnblockCustomer()

  const handleConfirm = () => {
    if (!customer) return
    unblockCustomer.mutate(customer.id, {
      onSuccess: () => {
        toast.success(t("unblockedToast", { name: customer.name }))
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, t("unblockFailed")),
    })
  }

  return (
    <AlertDialog open={customer !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("unblockTitle", { name: customer?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("unblockDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="primary"
            disabled={unblockCustomer.isPending}
            onClick={handleConfirm}
          >
            {unblockCustomer.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t("unblockCustomer")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
