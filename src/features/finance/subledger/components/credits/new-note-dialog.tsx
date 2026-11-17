"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useCreateNote } from "../../lib/mutations/subledger"
import { noteSchema, type NoteFormValues, type SubledgerErrorKey } from "../../lib/schema/subledger"
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
  const t = useTranslations("FinanceSubledger")
  const tCommon = useTranslations("Common")
  const tShared = useTranslations("FinanceShared")
  const { formatDate } = useFinanceDateFormat()
  const config = SUBLEDGER_SIDES[side]
  const errorText = (message?: string) => (message ? t(message as SubledgerErrorKey) : null)
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
          toast.success(
            t("noteSaved", { number: note.number, name: contact?.name ?? t(`theContact.${side}`) }),
          )
          onOpenChange(false)
        },
        onError: () => toast.error(t(`noteSaveFailed.${side}`)),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t(`notesNew.${side}`)}</DialogTitle>
            <DialogDescription>{t("noteDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="note-contact">{t(`contactSingular.${side}`)} *</FieldLabel>
              <Controller
                control={control}
                name="contact_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="note-contact" aria-invalid={Boolean(errors.contact_id)}>
                      <SelectValue placeholder={t(`chooseContact.${side}`)} />
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
              <FieldLabel htmlFor="note-amount">{tCommon("amount")} *</FieldLabel>
              <div className="relative">
                <Input
                  id="note-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.amount)}
                  className="pe-14 text-end tabular-nums"
                  {...register("amount")}
                />
                <span className="text-content-tertiary pointer-events-none absolute top-1/2 inset-e-3 -translate-y-1/2 text-[13px]">
                  {contact?.currency ?? "EGP"}
                </span>
              </div>
              {errors.amount ? <FieldError>{errorText(errors.amount.message)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="note-date">{tCommon("date")} *</FieldLabel>
              <Input id="note-date" type="date" {...register("date")} />
              <FieldDescription>{date ? formatDate(date) : "—"}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="note-reason">{t("reason")} *</FieldLabel>
              <Textarea id="note-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errorText(errors.reason.message)}</FieldError> : null}
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">{tShared("sessionOnlyNote")}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || createNote.isPending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { NewNoteDialog }
