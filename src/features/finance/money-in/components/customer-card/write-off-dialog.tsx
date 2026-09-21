"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useWriteOffBalance } from "../../lib/mutations/receivables"
import { writeOffSchema, type WriteOffFormValues } from "../../lib/schema/receivables"

type WriteOffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  customerName: string
}

/** Write off this balance? — charges the overdue invoices to bad debt, with a reason on record. */
function WriteOffDialog({ open, onOpenChange, customerId, customerName }: WriteOffDialogProps) {
  const writeOff = useWriteOffBalance()
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
      { id: customerId, reason },
      {
        onSuccess: (result) => {
          toast.success(
            `${customerName}'s invoices were written off (EGP ${formatAmount(result.written_off_base)}).`,
          )
          onOpenChange(false)
        },
        onError: () => toast.error("The balance could not be written off. Try again."),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Write off this balance?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FinanceAlert tone="warning" className="text-status-warning-fg">
              A write-off charges the outstanding amount to bad debt expense and clears the
              customer&apos;s balance. It is not a credit note, so the original invoice stays as issued.
              Recovering the money later needs a new entry.
            </FinanceAlert>
            <Field>
              <FieldLabel htmlFor="write-off-reason">Reason</FieldLabel>
              <Textarea id="write-off-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!isValid || writeOff.isPending}>
              Write off
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { WriteOffDialog }
