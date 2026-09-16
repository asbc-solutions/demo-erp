"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useSalaryChange } from "../../lib/mutations/salaries"
import {
  salaryChangeSchema,
  CHANGE_REASONS,
  CHANGE_TYPES,
  CHANGE_REASON_LABELS,
  CHANGE_TYPE_LABELS,
  type SalaryChangeFormValues,
} from "../../lib/schema/salary"
import type { EmployeeListItem } from "../../lib/types"

type SalaryChangeDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: EmployeeListItem[]
  employeesLoading?: boolean
}>

const DEFAULT_VALUES: SalaryChangeFormValues = {
  employee_id: "",
  basic_salary: 0,
  effective_date: "",
  change_reason: "annual_review",
  change_type: "increase",
}

function apiErrorDescription(err: unknown) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    return Object.entries(fields)
      .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
      .join(" | ")
  }
  return apiErr.message ?? "Please check the details and try again."
}

export function SalaryChangeDialog({
  open,
  onOpenChange,
  employees,
  employeesLoading = false,
}: SalaryChangeDialogProps) {
  const salaryChange = useSalaryChange()

  const form = useForm<SalaryChangeFormValues>({
    resolver: zodResolver(salaryChangeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form

  const selectedEmployeeId = watch("employee_id")
  const selectedReason = watch("change_reason")
  const selectedType = watch("change_type")

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset(DEFAULT_VALUES)
  }

  const onSubmit = (values: SalaryChangeFormValues) => {
    const payload = {
      basic_salary: values.basic_salary,
      effective_date: values.effective_date,
      change_reason: values.change_reason,
      change_type: values.change_type,
      ...(values.housing_allowance !== undefined
        ? { housing_allowance: values.housing_allowance }
        : {}),
      ...(values.transport_allowance !== undefined
        ? { transport_allowance: values.transport_allowance }
        : {}),
      ...(values.food_allowance !== undefined
        ? { food_allowance: values.food_allowance }
        : {}),
      ...(values.mobile_allowance !== undefined
        ? { mobile_allowance: values.mobile_allowance }
        : {}),
      ...(values.other_allowance !== undefined
        ? { other_allowance: values.other_allowance }
        : {}),
    }

    salaryChange.mutate(
      { employeeId: values.employee_id, payload },
      {
        onSuccess: (record) => {
          const employee = employees.find((e) => e.id === values.employee_id)
          toast.success("Salary updated", {
            description: `${employee?.full_name ?? "Employee"} · EGP ${record.basic_salary.toLocaleString("en-US")}`,
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          if (apiErr.code === "CONFLICT") {
            toast.error("No current salary", {
              description:
                "This employee has no active salary. Use 'Create Salary' instead.",
            })
            return
          }
          toast.error("Failed to update salary", {
            description: apiErrorDescription(err),
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              Salary change
            </DialogTitle>
            <p className="text-content-tertiary text-sm leading-5">
              Record a compensation change for payroll
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            {/* Employee */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                Employee <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedEmployeeId || undefined}
                onValueChange={(v) =>
                  setValue("employee_id", v, { shouldValidate: true })
                }
                disabled={employeesLoading || employees.length === 0}
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue
                    placeholder={
                      employeesLoading
                        ? "Loading employees..."
                        : "Select employee..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-xs text-brand-danger">
                  {errors.employee_id.message}
                </p>
              )}
            </div>

            {/* Effective date */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="salary-effective"
                className="text-sm font-semibold text-content-primary"
              >
                Effective date <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="salary-effective"
                type="date"
                {...register("effective_date")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.effective_date && (
                <p className="text-xs text-brand-danger">
                  {errors.effective_date.message}
                </p>
              )}
            </div>

            {/* Reason + Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  Reason <span className="text-brand-danger">*</span>
                </Label>
                <Select
                  value={selectedReason}
                  onValueChange={(v) =>
                    setValue(
                      "change_reason",
                      v as SalaryChangeFormValues["change_reason"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANGE_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {CHANGE_REASON_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  Type <span className="text-brand-danger">*</span>
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={(v) =>
                    setValue(
                      "change_type",
                      v as SalaryChangeFormValues["change_type"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANGE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CHANGE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Basic salary */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="salary-basic"
                className="text-sm font-semibold text-content-primary"
              >
                New basic salary (EGP) <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="salary-basic"
                type="number"
                min={1}
                step={1}
                {...register("basic_salary", { valueAsNumber: true })}
                placeholder="e.g. 28000"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.basic_salary && (
                <p className="text-xs text-brand-danger">
                  {errors.basic_salary.message}
                </p>
              )}
            </div>

            {/* Allowances */}
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["housing_allowance", "Housing"],
                  ["transport_allowance", "Transport"],
                  ["food_allowance", "Food"],
                  ["mobile_allowance", "Mobile"],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`salary-${field}`}
                    className="text-sm font-semibold text-content-primary"
                  >
                    {label} allowance
                  </Label>
                  <Input
                    id={`salary-${field}`}
                    type="number"
                    min={0}
                    step={1}
                    {...register(field, { valueAsNumber: true })}
                    placeholder="0"
                    className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md px-4 text-sm font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={salaryChange.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {salaryChange.isPending ? "Saving..." : "Submit change"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
