"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import type { SubledgerDocument } from "../../../subledger/lib/types/subledger"
import { useSendBackBill } from "../../lib/mutations/payables"
import { sendBackSchema, type PayablesErrorKey, type SendBackFormValues } from "../../lib/schema/payables"

type SendBackDialogProps = {
  bill: SubledgerDocument | null
  onOpenChange: (open: boolean) => void
  onSentBack: (bill: SubledgerDocument) => void
}

/** Reject this bill? — returns it to the requester with a reason; nothing posts. */
function SendBackDialog({ bill, onOpenChange, onSentBack }: SendBackDialogProps) {
  const t = useTranslations("FinanceMoneyOut")
  const tCommon = useTranslations("Common")
  const sendBack = useSendBackBill()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<SendBackFormValues>({
    resolver: zodResolver(sendBackSchema),
    mode: "onChange",
    defaultValues: { reason: "" },
  })

  React.useEffect(() => {
    if (bill) reset({ reason: "" })
  }, [bill, reset])

  const submit = ({ reason }: SendBackFormValues) => {
    if (!bill) return
    sendBack.mutate(
      { id: bill.id, reason },
      {
        onSuccess: () => {
          onSentBack(bill)
          onOpenChange(false)
        },
        onError: () => toast.error(t("sendBackFailed", { number: bill.number })),
      },
    )
  }

  return (
    <Dialog open={Boolean(bill)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="warning" className="text-status-warning-fg">
              {t("rejectExplainer")}
            </FinanceAlert>
            <Field>
              <FieldLabel htmlFor="send-back-reason">{t("reason")}</FieldLabel>
              <Textarea id="send-back-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason?.message ? (
                <FieldError>{t(errors.reason.message as PayablesErrorKey)}</FieldError>
              ) : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || sendBack.isPending}>
              {t("rejectBill")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { SendBackDialog }
