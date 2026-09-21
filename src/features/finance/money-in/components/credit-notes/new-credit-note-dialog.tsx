"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useFinanceContacts } from "../../../lib/queries/master-data"
import { formatDate } from "../../../lib/utils/date"
import { useCreateCreditNote } from "../../lib/mutations/receivables"
import { creditNoteSchema, type CreditNoteFormValues } from "../../lib/schema/receivables"

const EMPTY: CreditNoteFormValues = { customer_id: "", amount: "", date: "2026-03-31", reason: "" }

/** New credit note — recorded against the customer, unapplied until allocated. */
function NewCreditNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: customers = [] } = useFinanceContacts("customer")
  const createNote = useCreateCreditNote()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreditNoteFormValues>({
    resolver: zodResolver(creditNoteSchema),
    mode: "onChange",
    defaultValues: EMPTY,
  })

  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const selectedId = useWatch({ control, name: "customer_id" })
  const customer = customers.find((row) => row.id === selectedId)
  const date = useWatch({ control, name: "date" })

  const submit = (values: CreditNoteFormValues) =>
    createNote.mutate(
      { customer_id: values.customer_id, amount: Number(values.amount), date: values.date, reason: values.reason },
      {
        onSuccess: (note) => {
          toast.success(`${note.number} was saved against ${customer?.name ?? "the customer"}.`)
          onOpenChange(false)
        },
        onError: () => toast.error("The credit note could not be saved. Try again."),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>New credit note</DialogTitle>
            <DialogDescription>
              Saving records the note against the contact. It stays unapplied until allocated to a
              document.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="credit-note-customer">Customer *</FieldLabel>
              <Controller
                control={control}
                name="customer_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="credit-note-customer" aria-invalid={Boolean(errors.customer_id)}>
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="credit-note-amount">Amount *</FieldLabel>
              <div className="relative">
                <Input
                  id="credit-note-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.amount)}
                  className="pr-14 text-right tabular-nums"
                  {...register("amount")}
                />
                <span className="text-content-tertiary pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px]">
                  {customer?.currency ?? "EGP"}
                </span>
              </div>
              {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="credit-note-date">Date *</FieldLabel>
              <Input id="credit-note-date" type="date" {...register("date")} />
              <FieldDescription>{date ? formatDate(date) : "—"}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="credit-note-reason">Reason *</FieldLabel>
              <Textarea id="credit-note-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">
              Saved records live in this session only. The seeded data is never modified, so a reload
              returns the prototype to its known state.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || createNote.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { NewCreditNoteDialog }
