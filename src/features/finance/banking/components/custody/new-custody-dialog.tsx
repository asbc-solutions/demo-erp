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

import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useCreateCustody } from "../../lib/mutations/banking"
import { useEmployees } from "../../lib/queries/banking"
import { custodySchema, type CustodyFormValues } from "../../lib/schema/banking"

const EMPTY: CustodyFormValues = {
  employee_id: "",
  amount: "",
  treasury_id: "trs-main-cairo",
  date: "2026-03-31",
  description: "",
}

/** New custody — records an advance to an employee as a receivable. */
function NewCustodyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: employees = [] } = useEmployees()
  const { data: treasuries = [] } = useFinanceTreasuries()
  const createCustody = useCreateCustody()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustodyFormValues>({ resolver: zodResolver(custodySchema), defaultValues: EMPTY })

  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const date = useWatch({ control, name: "date" })

  const submit = (values: CustodyFormValues) =>
    createCustody.mutate(
      { ...values, amount: Number(values.amount) },
      {
        onSuccess: (holder) => {
          toast.success(`${holder.name} now holds ${formatAmount(holder.outstanding)} EGP in custody.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The custody could not be saved. Try again.")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>New custody</DialogTitle>
            <DialogDescription>
              Custody is cash advanced to an employee. Saving records the advance as a receivable — it does
              not pay the money out.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="custody-employee">Employee *</FieldLabel>
              <Controller
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="custody-employee" aria-invalid={Boolean(errors.employee_id)}>
                      <SelectValue placeholder="Choose the employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.code} · {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employee_id ? <FieldError>{errors.employee_id.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="custody-amount">Advanced (EGP) *</FieldLabel>
              <Input
                id="custody-amount"
                inputMode="decimal"
                placeholder="0.00"
                className="text-end tabular-nums"
                aria-invalid={Boolean(errors.amount)}
                {...register("amount")}
              />
              {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="custody-treasury">Treasury *</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="custody-treasury">
                      <SelectValue />
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
              <FieldLabel htmlFor="custody-date">Date *</FieldLabel>
              <Input id="custody-date" type="date" {...register("date")} />
              <FieldDescription>{date ? formatDate(date) : "—"}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="custody-description">Description *</FieldLabel>
              <Textarea id="custody-description" rows={2} aria-invalid={Boolean(errors.description)} {...register("description")} />
              {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
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
            <Button type="submit" variant="primary" disabled={createCustody.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { NewCustodyDialog }
