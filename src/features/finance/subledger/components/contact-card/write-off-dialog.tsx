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
import { formatAmount } from "../../../lib/utils/money"
import { useWriteOffBalance } from "../../lib/mutations/subledger"
import { writeOffSchema, type SubledgerErrorKey, type WriteOffFormValues } from "../../lib/schema/subledger"
import type { Side } from "../../lib/types/subledger"

type WriteOffDialogProps = {
  side: Side
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  contactName: string
}

/** Write off this balance? — clears the contact's open documents, with a reason on record. */
function WriteOffDialog({ side, open, onOpenChange, contactId, contactName }: WriteOffDialogProps) {
  const t = useTranslations("FinanceSubledger")
  const tCommon = useTranslations("Common")
  const writeOff = useWriteOffBalance(side)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<WriteOffFormValues>({
    resolver: zodResolver(writeOffSchema),
    mode: "onChange",
    defaultValues: { reason: "" },
  })

  React.useEffect(() => {
    if (open) reset({ reason: "" })
  }, [open, reset])

  const submit = ({ reason }: WriteOffFormValues) =>
    writeOff.mutate(
      { id: contactId, reason },
      {
        onSuccess: (result) => {
          toast.success(
            t(`writeOffDone.${side}`, { name: contactName, amount: formatAmount(result.written_off_base) }),
          )
          onOpenChange(false)
        },
        onError: () => toast.error(t("writeOffFailed")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("writeOffTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="warning" className="text-status-warning-fg">
              {t(`writeOffExplainer.${side}`)}
            </FinanceAlert>
            <Field>
              <FieldLabel htmlFor="write-off-reason">{t("reason")}</FieldLabel>
              <Textarea id="write-off-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason?.message ? (
                <FieldError>{t(errors.reason.message as SubledgerErrorKey)}</FieldError>
              ) : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || writeOff.isPending}>
              {t("writeOff")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { WriteOffDialog }
