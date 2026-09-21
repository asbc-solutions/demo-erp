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
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useCreateNote } from "../../lib/mutations/subledger"
import { noteSchema, type NoteFormValues } from "../../lib/schema/subledger"
import type { Side } from "../../lib/types/subledger"

const EMPTY: NoteFormValues = { contact_id: "", amount: "", date: "2026-03-31", reason: "" }

/** New credit or debit note — recorded against the contact, unapplied until allocated. */
function NewNoteDialog({
  side,
  open,
  onOpenChange,
}: {
  side: Side
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const config = SUBLEDGER_SIDES[side]
  const { data: contacts = [] } = useFinanceContacts(config.contactKind)
  const createNote = useCreateNote(side)
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    mode: "onChange",
    defaultValues: EMPTY,
  })

  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const selectedId = useWatch({ control, name: "contact_id" })
  const contact = contacts.find((row) => row.id === selectedId)
  const date = useWatch({ control, name: "date" })

  const submit = (values: NoteFormValues) =>
    createNote.mutate(
      { contact_id: values.contact_id, amount: Number(values.amount), date: values.date, reason: values.reason },
      {
        onSuccess: (note) => {
          toast.success(`${note.number} was saved against ${contact?.name ?? `the ${config.contact.lower}`}.`)
          onOpenChange(false)
        },
        onError: () => toast.error(`The ${config.notes.noun} could not be saved. Try again.`),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{config.notes.newLabel}</DialogTitle>
            <DialogDescription>
              Saving records the note against the contact. It stays unapplied until allocated to a
              document.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="note-contact">{config.contact.singular} *</FieldLabel>
              <Controller
                control={control}
                name="contact_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="note-contact" aria-invalid={Boolean(errors.contact_id)}>
                      <SelectValue placeholder={`Choose a ${config.contact.lower}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((row) => (
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
              <FieldLabel htmlFor="note-amount">Amount *</FieldLabel>
              <div className="relative">
                <Input
                  id="note-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.amount)}
                  className="pr-14 text-right tabular-nums"
                  {...register("amount")}
                />
                <span className="text-content-tertiary pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px]">
                  {contact?.currency ?? "EGP"}
                </span>
              </div>
              {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="note-date">Date *</FieldLabel>
              <Input id="note-date" type="date" {...register("date")} />
              <FieldDescription>{date ? formatDate(date) : "—"}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="note-reason">Reason *</FieldLabel>
              <Textarea id="note-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
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

export { NewNoteDialog }
