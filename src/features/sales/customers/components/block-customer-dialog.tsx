"use client"

import * as React from "react"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useToastMutationError } from "../../components/shared/sales-error-state"
import { useBlockCustomer } from "../../lib/mutations/customers"
import type { CustomerListItem } from "../../lib/types"

export function BlockCustomerDialog({
  customer,
  onOpenChange,
}: Readonly<{ customer: CustomerListItem | null; onOpenChange: (open: boolean) => void }>) {
  const t = useTranslations("SalesCustomers")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [reason, setReason] = React.useState("")
  const blockCustomer = useBlockCustomer()
  const isValid = reason.trim().length >= 10

  const handleConfirm = () => {
    if (!customer || !isValid) return
    blockCustomer.mutate(
      { id: customer.id, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(t("blockedToast", { name: customer.name }))
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("blockFailed")),
      }
    )
  }

  return (
    <AlertDialog open={customer !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("blockTitle", { name: customer?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("blockDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5 px-6 pb-6 text-start">
          <span className="text-xs font-medium text-content-secondary">{t("blockReason")}</span>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("blockReasonPlaceholder")}
            aria-invalid={reason.length > 0 && !isValid}
          />
          {reason.length > 0 && !isValid ? (
            <span className="text-brand-danger text-xs">{t("blockReasonMin")}</span>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="danger"
            disabled={!isValid || blockCustomer.isPending}
            onClick={handleConfirm}
          >
            {blockCustomer.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t("blockCustomer")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
