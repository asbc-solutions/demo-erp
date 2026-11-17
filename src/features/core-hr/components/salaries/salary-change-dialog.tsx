"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

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
  type SalaryChangeFormValues,
} from "../../lib/schema/salary"
import type { EmployeeListItem } from "../../lib/types"
import { useIntlLocale } from "@/src/i18n/intl-locale"
import { useFieldError } from "../../lib/hooks/use-field-error"

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

function apiErrorDescription(err: unknown, fallback: string) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    return Object.entries(fields)
      .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
      .join(" | ")
  }
  return apiErr.message ?? fallback
}

export function SalaryChangeDialog({
  open,
  onOpenChange,
  employees,
  employeesLoading = false,
}: SalaryChangeDialogProps) {
  const t = useTranslations("HrSalaries")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const intlLocale = useIntlLocale()
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
          toast.success(t("salaryUpdated"), {
            description: `${employee?.full_name ?? t("fieldEmployee")} · EGP ${record.basic_salary.toLocaleString(intlLocale)}`,
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          if (apiErr.code === "CONFLICT") {
            toast.error(t("noCurrentSalary"), {
              description: t("noCurrentSalaryDescription"),
            })
            return
          }
          toast.error(t("updateFailed"), {
            description: apiErrorDescription(err, t("checkDetails")),
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
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {t("dialogTitle")}
            </DialogTitle>
            <p className="text-content-tertiary text-sm leading-5">
              {t("dialogSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            {/* Employee */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldEmployee")} <span className="text-brand-danger">*</span>
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
                        ? t("loadingEmployees")
                        : t("selectEmployee")
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
                  {fieldError(errors.employee_id.message)}
                </p>
              )}
            </div>

            {/* Effective date */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="salary-effective"
                className="text-sm font-semibold text-content-primary"
              >
                {t("fieldEffectiveDate")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="salary-effective"
                type="date"
                {...register("effective_date")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.effective_date && (
                <p className="text-xs text-brand-danger">
                  {fieldError(errors.effective_date.message)}
                </p>
              )}
            </div>

            {/* Reason + Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldReason")} <span className="text-brand-danger">*</span>
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
                        {tShared(`changeReason.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {tCommon("type")} <span className="text-brand-danger">*</span>
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
                    {CHANGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {tShared(`changeType.${type}`)}
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
                {t("fieldNewBasicSalary")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="salary-basic"
                type="number"
                min={1}
                step={1}
                {...register("basic_salary", { valueAsNumber: true })}
                placeholder={t("phBasicSalary")}
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.basic_salary && (
                <p className="text-xs text-brand-danger">
                  {fieldError(errors.basic_salary.message)}
                </p>
              )}
            </div>

            {/* Allowances */}
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["housing_allowance", "housingAllowance"],
                  ["transport_allowance", "transportAllowance"],
                  ["food_allowance", "foodAllowance"],
                  ["mobile_allowance", "mobileAllowance"],
                ] as const
              ).map(([field, labelKey]) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`salary-${field}`}
                    className="text-sm font-semibold text-content-primary"
                  >
                    {t(labelKey)}
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
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={salaryChange.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {salaryChange.isPending ? tShared("saving") : t("submitChange")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
