"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
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
import { Switch } from "@/src/shared/components/ui/switch"
import type { ApiError } from "@/src/shared/lib/types/api"

import {
  useCreateContract,
  useRenewContract,
} from "../../lib/mutations/contracts"
import {
  contractSchema,
  END_DATE_REQUIRED_CONTRACT_TYPES,
  type ContractFormValues,
} from "../../lib/schema/contract"
import type {
  ContractListItem,
  ContractType,
  EmployeeListItem,
} from "../../lib/types"
import { useFieldError } from "../../lib/hooks/use-field-error"

const CONTRACT_TYPES: readonly ContractType[] = [
  "permanent",
  "fixed_term",
  "temporary",
  "internship",
  "contract",
  "seasonal",
  "secondment",
]

const NOTICE_UNITS = ["day", "week", "month"] as const

type NewContractDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: EmployeeListItem[]
  employeesLoading?: boolean
  mode?: "create" | "renew"
  initialContract?: ContractListItem | null
}>

function addDay(date: string | null | undefined) {
  const today = new Date().toISOString().slice(0, 10)
  if (!date) return today
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return today
  parsed.setDate(parsed.getDate() + 1)
  return parsed.toISOString().slice(0, 10)
}

function cleanOptional(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function apiErrorDescription(err: unknown, fallback: string) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined

  if (fields) {
    return Object.entries(fields)
      .map(([field, messages]) => `${field.replace(/_/g, " ")}: ${messages[0]}`)
      .join(" | ")
  }

  return apiErr.message ?? fallback
}

function buildDefaults(
  mode: "create" | "renew",
  contract?: ContractListItem | null
): ContractFormValues {
  const contractType = contract?.contract_type ?? "permanent"
  const needsEndDate = END_DATE_REQUIRED_CONTRACT_TYPES.includes(
    contractType as (typeof END_DATE_REQUIRED_CONTRACT_TYPES)[number]
  )

  return {
    employee_id: contract?.employee_id ?? "",
    contract_type: contractType,
    start_date: mode === "renew" ? addDay(contract?.end_date) : "",
    end_date: undefined,
    is_open_ended: !needsEndDate,
    work_location: "",
    work_schedule: "standard",
    weekly_hours: 40,
    probation_days: 90,
    notice_period_days: 30,
    notice_period_unit: "day",
  }
}

export function NewContractDialog({
  open,
  onOpenChange,
  employees,
  employeesLoading = false,
  mode = "create",
  initialContract = null,
}: NewContractDialogProps) {
  const t = useTranslations("HrContracts")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const createContract = useCreateContract()
  const renewContract = useRenewContract()
  const isRenewal = mode === "renew"

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: buildDefaults(mode, initialContract),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = form

  React.useEffect(() => {
    if (open) reset(buildDefaults(mode, initialContract))
  }, [initialContract, mode, open, reset])

  const selectedType = useWatch({ control, name: "contract_type" })
  const isOpenEnded = useWatch({ control, name: "is_open_ended" })
  const selectedEmployeeId = useWatch({ control, name: "employee_id" })
  const noticeUnit = useWatch({ control, name: "notice_period_unit" })
  const requiresEndDate = END_DATE_REQUIRED_CONTRACT_TYPES.includes(
    selectedType as (typeof END_DATE_REQUIRED_CONTRACT_TYPES)[number]
  )
  const isPending = createContract.isPending || renewContract.isPending

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset(buildDefaults(mode, initialContract))
  }

  const onSubmit = (values: ContractFormValues) => {
    const payload = {
      contract_type: values.contract_type,
      start_date: values.start_date,
      is_open_ended: values.is_open_ended,
      ...(values.is_open_ended ? {} : { end_date: values.end_date }),
      work_location: cleanOptional(values.work_location),
      work_schedule: cleanOptional(values.work_schedule),
      weekly_hours: values.weekly_hours ?? null,
      probation_days: values.probation_days ?? null,
      notice_period_days: values.notice_period_days ?? null,
      notice_period_unit: values.notice_period_unit ?? null,
    }

    const mutation = isRenewal ? renewContract : createContract

    mutation.mutate(
      { employeeId: values.employee_id, payload },
      {
        onSuccess: (result) => {
          const contractNumber =
            "contract" in result
              ? result.contract.contract_number
              : result.contract_number
          toast.success(isRenewal ? t("renewedToast") : t("createdToast"), {
            description: contractNumber,
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          toast.error(
            isRenewal ? t("renewFailed") : t("createFailed"),
            {
              description: apiErrorDescription(err, t("checkDetails")),
            }
          )
        },
      }
    )
  }

  const title = isRenewal ? t("renewContract") : t("newContract")
  const description = isRenewal
    ? t("renewSubtitle")
    : t("createSubtitle")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {title}
            </DialogTitle>
            <p className="text-sm leading-5 text-content-tertiary">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("colEmployee")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedEmployeeId || undefined}
                onValueChange={(value) =>
                  setValue("employee_id", value, { shouldValidate: true })
                }
                disabled={
                  isRenewal || employeesLoading || employees.length === 0
                }
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
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.employee_number})
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldContractType")} <span className="text-brand-danger">*</span>
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    const nextType = value as ContractType
                    const nextRequiresEnd =
                      END_DATE_REQUIRED_CONTRACT_TYPES.includes(
                        nextType as (typeof END_DATE_REQUIRED_CONTRACT_TYPES)[number]
                      )
                    setValue("contract_type", nextType, {
                      shouldValidate: true,
                    })
                    setValue("is_open_ended", !nextRequiresEnd, {
                      shouldValidate: true,
                    })
                    if (!nextRequiresEnd) {
                      setValue("end_date", undefined, { shouldValidate: true })
                    }
                  }}
                >
                  <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {tShared(`contractType.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-start"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("startDate")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  id="contract-start"
                  type="date"
                  {...register("start_date")}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.start_date && (
                  <p className="text-xs text-brand-danger">
                    {fieldError(errors.start_date.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-end"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("endDate")}
                  {requiresEndDate && (
                    <span className="text-brand-danger"> *</span>
                  )}
                </Label>
                <Input
                  id="contract-end"
                  type="date"
                  {...register("end_date")}
                  disabled={isOpenEnded}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm disabled:opacity-50"
                />
                {errors.end_date && (
                  <p className="text-xs text-brand-danger">
                    {fieldError(errors.end_date.message)}
                  </p>
                )}
              </div>

              <label className="flex h-9 items-center gap-2 text-sm font-medium text-content-secondary">
                <Switch
                  checked={isOpenEnded}
                  disabled={requiresEndDate}
                  onCheckedChange={(checked) => {
                    setValue("is_open_ended", checked, {
                      shouldValidate: true,
                    })
                    if (checked) {
                      setValue("end_date", undefined, {
                        shouldValidate: true,
                      })
                    }
                  }}
                />
                {t("openEnded")}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-location"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("fieldWorkLocation")}
                </Label>
                <Input
                  id="contract-location"
                  {...register("work_location")}
                  placeholder={t("phWorkLocation")}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-schedule"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("fieldWorkSchedule")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  id="contract-schedule"
                  {...register("work_schedule")}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.work_schedule && (
                  <p className="text-xs text-brand-danger">
                    {fieldError(errors.work_schedule.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-hours"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("fieldWeeklyHours")}
                </Label>
                <Input
                  id="contract-hours"
                  type="number"
                  min={1}
                  step={1}
                  {...register("weekly_hours", { valueAsNumber: true })}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.weekly_hours && (
                  <p className="text-xs text-brand-danger">
                    {fieldError(errors.weekly_hours.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-probation"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("fieldProbationDays")}
                </Label>
                <Input
                  id="contract-probation"
                  type="number"
                  min={0}
                  step={1}
                  {...register("probation_days", { valueAsNumber: true })}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.probation_days && (
                  <p className="text-xs text-brand-danger">
                    {fieldError(errors.probation_days.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="contract-notice"
                  className="text-sm font-semibold text-content-primary"
                >
                  {t("noticePeriodLabel")}
                </Label>
                <Input
                  id="contract-notice"
                  type="number"
                  min={0}
                  step={1}
                  {...register("notice_period_days", { valueAsNumber: true })}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.notice_period_days && (
                  <p className="text-xs text-brand-danger">
                    {fieldError(errors.notice_period_days.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldNoticeUnit")}
              </Label>
              <Select
                value={noticeUnit}
                onValueChange={(value) =>
                  setValue(
                    "notice_period_unit",
                    value as ContractFormValues["notice_period_unit"],
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {t(`noticeUnit.${unit}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {isPending
                ? isRenewal
                  ? t("renewing")
                  : t("creating")
                : isRenewal
                  ? t("renewContractCta")
                  : t("createContractCta")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
