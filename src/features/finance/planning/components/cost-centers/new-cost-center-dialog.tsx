"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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

import { errorMessage } from "../../../lib/utils/api"
import { COST_CENTER_TYPES } from "../../lib/constants/planning"
import { useCreateCostCenter } from "../../lib/mutations/planning"
import type { CostCenter } from "../../lib/types/planning"
import { SESSION_NOTE } from "../budgets/budgets-page"

const NO_PARENT = "none"

const centerSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^CC-\d{3}$/i, "Cost center codes look like CC-900."),
  name: z.string().trim().min(1, "Enter the English name."),
  name_ar: z.string().trim().min(1, "Enter the Arabic name."),
  type: z.enum(["department", "branch", "project"]),
  parent_id: z.string(),
})
type CenterValues = z.infer<typeof centerSchema>

function NewCostCenterDialog({
  open,
  onOpenChange,
  centers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  centers: CostCenter[]
}) {
  const create = useCreateCostCenter()
  const empty = React.useMemo<CenterValues>(() => ({ code: "CC-900", name: "", name_ar: "", type: "department", parent_id: NO_PARENT }), [])
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CenterValues>({ resolver: zodResolver(centerSchema), defaultValues: empty })
  React.useEffect(() => {
    if (open) reset(empty)
  }, [open, reset, empty])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            create.mutate(
              { ...values, code: values.code.toUpperCase(), parent_id: values.parent_id === NO_PARENT ? null : values.parent_id },
              {
                onSuccess: (center) => {
                  toast.success(`${center.code} · ${center.name} is added to the hierarchy.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The cost center could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>New cost center</DialogTitle>
            <DialogDescription>A cost center groups actuals and budgets. Saving adds it to the hierarchy; no posted line is reclassified.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="center-code">Code *</FieldLabel>
              <Input id="center-code" className="w-40 font-mono uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
              {errors.code ? <FieldError>{errors.code.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="center-name">Name (English) *</FieldLabel>
              <Input id="center-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="center-name-ar">Name (Arabic) *</FieldLabel>
              <Input id="center-name-ar" dir="rtl" lang="ar" aria-invalid={Boolean(errors.name_ar)} {...register("name_ar")} />
              {errors.name_ar ? <FieldError>{errors.name_ar.message}</FieldError> : <FieldDescription>Shown when the workspace is switched to Arabic.</FieldDescription>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="center-type">Type *</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="center-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COST_CENTER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="center-parent">Parent</FieldLabel>
                <Controller
                  control={control}
                  name="parent_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="center-parent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT}>None — top level</SelectItem>
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.code} · {center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <p className="text-content-tertiary text-[13px] leading-5">{SESSION_NOTE}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { NewCostCenterDialog }
