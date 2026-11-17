"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { ApiError } from "@/src/shared/lib/types/api"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { Input } from "@/src/shared/components/ui/input"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/src/shared/components/ui/radio-group"

import { useSubmitLeaveRequest } from "../../lib/mutations/leave"
import { useLeaveTypes } from "../../lib/queries/leave"
import {
  submitLeaveRequestSchema,
  type SubmitLeaveRequestFormValues,
} from "../../lib/schema/leave"
import type { LeaveType } from "../../lib/types"

type ApplyLeaveDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  fallbackLeaveTypes?: LeaveType[]
  fallbackLeaveTypeIds?: string[]
}>

type LeaveTypeOption = {
  id: string
  name: string
  is_active?: boolean
}

/** The shared schema carries English messages; map the known ones to keys for display. */
const SCHEMA_ERROR_KEYS = {
  "Date must be YYYY-MM-DD": "errorDateFormat",
  "Leave type is required": "errorLeaveTypeRequired",
  "Start date is required": "errorStartDateRequired",
  "End date is required": "errorEndDateRequired",
  "Reason is too long": "errorReasonTooLong",
  "End date must be on or after the start date": "errorEndBeforeStart",
  "Half-day leave must start and end on the same date": "errorHalfDaySameDate",
  "Select which half of the day": "errorHalfDayPeriod",
} as const

function isSchemaErrorMessage(
  message: string,
): message is keyof typeof SCHEMA_ERROR_KEYS {
  return message in SCHEMA_ERROR_KEYS
}

function uniqueLeaveTypeOptions(options: LeaveTypeOption[]) {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.id)) return false
    seen.add(option.id)
    return true
  })
}

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  fallbackLeaveTypeIds = [],
  fallbackLeaveTypes = [],
}: ApplyLeaveDialogProps) {
  const t = useTranslations("HrLeaves")
  const tCommon = useTranslations("Common")
  const submitRequest = useSubmitLeaveRequest()
  const {
    data: typesData,
    isLoading: typesLoading,
    isError: typesError,
  } = useLeaveTypes({ is_active: true, per_page: 100 }, { enabled: open })

  const apiTypeOptions = (typesData?.data ?? []).map((type) => ({
    id: type.id,
    name: type.name,
    is_active: type.is_active,
  }))
  const fallbackTypeOptions = fallbackLeaveTypes.map((type) => ({
    id: type.id,
    name: type.name,
    is_active: type.is_active,
  }))
  const fallbackIdOptions = fallbackLeaveTypeIds.map((id) => ({
    id,
    name: t("leaveTypeFallback", { id: id.slice(0, 8) }),
    is_active: true,
  }))
  const leaveTypes = uniqueLeaveTypeOptions(
    [...apiTypeOptions, ...fallbackTypeOptions, ...fallbackIdOptions].filter(
      (type) => type.is_active !== false,
    ),
  )

  const form = useForm<SubmitLeaveRequestFormValues>({
    resolver: zodResolver(submitLeaveRequestSchema),
    defaultValues: {
      leave_type_id: "",
      start_date: "",
      end_date: "",
      is_half_day: false,
      half_day_period: "first_half",
      reason: "",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = form
  const leaveTypeId = useWatch({ control, name: "leave_type_id" })
  const isHalfDay = useWatch({ control, name: "is_half_day" })
  const selectedStartDate = useWatch({ control, name: "start_date" })
  const halfDayPeriod = useWatch({ control, name: "half_day_period" })

  const errorText = (message?: string) =>
    message && isSchemaErrorMessage(message)
      ? t(SCHEMA_ERROR_KEYS[message])
      : message

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: SubmitLeaveRequestFormValues) => {
    submitRequest.mutate(
      {
        leave_type_id: values.leave_type_id,
        start_date: values.start_date,
        end_date: values.end_date,
        is_half_day: values.is_half_day,
        half_day_period: values.is_half_day
          ? values.half_day_period
          : undefined,
        reason: values.reason?.trim() ? values.reason.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("requestSubmitted"), {
            description: t("requestSubmittedDescription"),
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          const apiError = err as unknown as ApiError
          toast.error(t("requestSubmitFailed"), {
            description: apiError.message ?? t("reviewDetailsRetry"),
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
          className="flex flex-col gap-5 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle>{t("applyForLeave")}</DialogTitle>
            <DialogDescription>
              {t("applyForLeaveDescription")}
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-content-primary">
              {t("leaveType")} <span className="text-brand-danger">*</span>
            </Label>
            <Select
              value={leaveTypeId || undefined}
              onValueChange={(val) =>
                setValue("leave_type_id", val, { shouldValidate: true })
              }
              disabled={typesLoading}
            >
              <SelectTrigger className="rounded-[10px]">
                <SelectValue
                  placeholder={
                    typesLoading ? t("loadingTypes") : t("selectLeaveType")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-content-tertiary">
                    {typesLoading
                      ? t("loadingTypes")
                      : typesError
                        ? t("leaveTypesLoadError")
                        : t("noLeaveTypes")}
                  </div>
                ) : (
                  leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.leave_type_id && (
              <p className="text-xs text-brand-danger">
                {errorText(errors.leave_type_id.message)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("startDate")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                type="date"
                className="rounded-[10px]"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-xs text-brand-danger">
                  {errorText(errors.start_date.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("endDate")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                type="date"
                className="rounded-[10px]"
                min={selectedStartDate || undefined}
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-xs text-brand-danger">
                  {errorText(errors.end_date.message)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[10px] border border-stroke-default p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-content-primary">
              <Checkbox
                checked={isHalfDay}
                onCheckedChange={(checked) => {
                  const next = checked === true
                  setValue("is_half_day", next, { shouldValidate: true })
                  if (next && selectedStartDate) {
                    setValue("end_date", selectedStartDate, {
                      shouldValidate: true,
                    })
                  }
                }}
              />
              {t("halfDayLeave")}
            </label>

            {isHalfDay ? (
              <RadioGroup
                value={halfDayPeriod}
                onValueChange={(value) =>
                  setValue(
                    "half_day_period",
                    value as SubmitLeaveRequestFormValues["half_day_period"],
                    { shouldValidate: true },
                  )
                }
                className="grid grid-cols-2 gap-3"
              >
                <label className="flex items-center gap-2 rounded-lg border border-stroke-default px-3 py-2 text-sm text-content-secondary">
                  <RadioGroupItem value="first_half" />
                  {t("firstHalf")}
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-stroke-default px-3 py-2 text-sm text-content-secondary">
                  <RadioGroupItem value="second_half" />
                  {t("secondHalf")}
                </label>
              </RadioGroup>
            ) : null}
            {errors.half_day_period && (
              <p className="text-xs text-brand-danger">
                {errorText(errors.half_day_period.message)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-content-primary">
              {t("reason")}
            </Label>
            <Textarea
              placeholder={t("reasonPlaceholder")}
              rows={3}
              maxLength={500}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-brand-danger">
                {errorText(errors.reason.message)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="rounded-[10px]"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-[10px]"
              disabled={submitRequest.isPending}
            >
              {submitRequest.isPending ? t("submitting") : t("submitRequest")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
