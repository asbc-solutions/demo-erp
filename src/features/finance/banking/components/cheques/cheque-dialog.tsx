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

import { useFinanceContacts, useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { useCreateCheque } from "../../lib/mutations/banking"
import { chequeSchema, type ChequeFormValues } from "../../lib/schema/banking"
import type { ChequeDirection } from "../../lib/types/banking"

const TODAY = "2026-03-31"

export const CHEQUE_COPY = {
  received: { title: "Record cheque", party: "Drawer", contactKind: "customer", partyHint: "The customer who wrote the cheque" },
  issued: { title: "Write cheque", party: "Payee", contactKind: "supplier", partyHint: "The supplier the cheque is made out to" },
} as const

type ChequeDialogProps = {
  direction: ChequeDirection
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Next free leaf of an issued cheque book, suggested as the number. */
  nextNumber?: number | null
}

/** Record cheque / Write cheque — registers it at its opening status; nothing posts until it clears. */
function ChequeDialog({ direction, open, onOpenChange, nextNumber }: ChequeDialogProps) {
  const copy = CHEQUE_COPY[direction]
  const { data: contacts = [] } = useFinanceContacts(copy.contactKind)
  const { data: treasuries = [] } = useFinanceTreasuries()
  const banks = treasuries.filter((row) => row.kind === "bank")
  const createCheque = useCreateCheque()

  const empty = React.useMemo<ChequeFormValues>(
    () => ({
      number: direction === "issued" && nextNumber ? String(nextNumber) : "",
      contact_id: "",
      bank: direction === "issued" ? "CIB" : "",
      amount: "",
      issue_date: TODAY,
      due_date: TODAY,
      treasury_id: "bnk-cib-0021",
    }),
    [direction, nextNumber],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChequeFormValues>({ resolver: zodResolver(chequeSchema), defaultValues: empty })

  React.useEffect(() => {
    if (open) reset(empty)
  }, [open, reset, empty])

  const [issueDate, dueDate] = useWatch({ control, name: ["issue_date", "due_date"] })

  const submit = (values: ChequeFormValues) =>
    createCheque.mutate(
      { ...values, direction, amount: Number(values.amount) },
      {
        onSuccess: (cheque) => {
          toast.success(`Cheque ${cheque.number} is in the register as ${cheque.status.replace(/_/g, " ")}.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The cheque could not be saved. Try again.")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>
              Saving registers the cheque in the register at its opening status. It does not post an entry;
              that happens as the cheque clears.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cheque-number">Cheque no. *</FieldLabel>
                <Input id="cheque-number" inputMode="numeric" className="font-mono" aria-invalid={Boolean(errors.number)} {...register("number")} />
                {errors.number ? <FieldError>{errors.number.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-party">{copy.party} *</FieldLabel>
                <Controller
                  control={control}
                  name="contact_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="cheque-party" aria-invalid={Boolean(errors.contact_id)}>
                        <SelectValue placeholder={copy.partyHint} />
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
                {errors.contact_id ? <FieldError>{errors.contact_id.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-bank">Bank *</FieldLabel>
                <Input id="cheque-bank" placeholder="e.g. CIB" aria-invalid={Boolean(errors.bank)} {...register("bank")} />
                {errors.bank ? <FieldError>{errors.bank.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-amount">Amount *</FieldLabel>
                <div className="relative">
                  <Input
                    id="cheque-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pr-14 text-right tabular-nums"
                    aria-invalid={Boolean(errors.amount)}
                    {...register("amount")}
                  />
                  <span className="text-content-tertiary pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px]">
                    EGP
                  </span>
                </div>
                {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-issued">Issue date *</FieldLabel>
                <Input id="cheque-issued" type="date" {...register("issue_date")} />
                <FieldDescription>{issueDate ? formatDate(issueDate) : "—"}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-due">Due date *</FieldLabel>
                <Input id="cheque-due" type="date" aria-invalid={Boolean(errors.due_date)} {...register("due_date")} />
                {errors.due_date ? (
                  <FieldError>{errors.due_date.message}</FieldError>
                ) : (
                  <FieldDescription>{dueDate ? formatDate(dueDate) : "—"}</FieldDescription>
                )}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="cheque-treasury">Treasury *</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cheque-treasury">
                      <SelectValue placeholder="Choose the bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.code} · {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">
              Saved records live in this session only. The seeded data is never modified, so a reload returns the
              prototype to its known state.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createCheque.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { ChequeDialog }
