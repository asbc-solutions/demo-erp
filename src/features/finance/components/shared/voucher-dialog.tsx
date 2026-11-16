"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

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

import { voucherSchema, type VoucherFormValues } from "../../lib/schema/voucher"
import type { FinanceContact, FinanceTreasury } from "../../lib/types/common"
import { formatDate } from "../../lib/utils/date"

/** The finance calendar's today; new vouchers default to it. */
const VOUCHER_DEFAULT_DATE = "2026-03-31"

const COPY = {
  receipt: { title: "New receipt", contact: "Customer", treasury: "Into" },
  payment: { title: "New payment", contact: "Supplier", treasury: "From" },
} as const

type VoucherDialogProps = {
  kind: keyof typeof COPY
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: FinanceContact[]
  treasuries: FinanceTreasury[]
  pending: boolean
  onSubmit: (values: VoucherFormValues) => void
}

const EMPTY: VoucherFormValues = {
  contact_id: "",
  treasury_id: "",
  amount: "",
  date: VOUCHER_DEFAULT_DATE,
  description: "",
}

/**
 * Voucher detail (02.05 receipts, 03.05 payments). Saving records the voucher
 * as a draft; it posts from the journal once the counter-account is set.
 */
function VoucherDialog({
  kind,
  open,
  onOpenChange,
  contacts,
  treasuries,
  pending,
  onSubmit,
}: VoucherDialogProps) {
  const copy = COPY[kind]
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    mode: "onChange",
    defaultValues: { ...EMPTY, treasury_id: treasuries[0]?.id ?? "" },
  })
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = form

  const selectedId = useWatch({ control, name: "contact_id" })
  const contact = contacts.find((row) => row.id === selectedId)
  const date = useWatch({ control, name: "date" })

  React.useEffect(() => {
    if (open) reset({ ...EMPTY, treasury_id: treasuries[0]?.id ?? "" })
  }, [open, reset, treasuries])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>
              Saving records the voucher. It does not post to the ledger — post it from the journal
              once the counter-account is set.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="voucher-contact">{copy.contact} *</FieldLabel>
              <Controller
                control={control}
                name="contact_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="voucher-contact" aria-invalid={Boolean(errors.contact_id)}>
                      <SelectValue placeholder={`Choose a ${copy.contact.toLowerCase()}`} />
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
              <FieldLabel htmlFor="voucher-treasury">{copy.treasury} *</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="voucher-treasury" aria-invalid={Boolean(errors.treasury_id)}>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {treasuries.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.code} · {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="voucher-amount">Amount *</FieldLabel>
              <div className="relative">
                <Input
                  id="voucher-amount"
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
              {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="voucher-date">Date *</FieldLabel>
              <Input id="voucher-date" type="date" aria-invalid={Boolean(errors.date)} {...register("date")} />
              <FieldDescription>{date ? formatDate(date) : "—"}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="voucher-description">Description *</FieldLabel>
              <Textarea
                id="voucher-description"
                rows={2}
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
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
            <Button type="submit" variant="primary" disabled={!isValid || pending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { VoucherDialog }
