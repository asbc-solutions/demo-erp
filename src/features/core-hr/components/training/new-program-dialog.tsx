"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useCreateProgram } from "../../lib/mutations/training"
import {
  programCategoryValues,
  programStatusValues,
  trainingProgramSchema,
  type TrainingProgramFormValues,
} from "../../lib/schema/training-program"
import type { CreateProgramPayload } from "../../lib/types"
import { categoryLabel } from "./training-format"

type NewProgramDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

const FIELD_CLASS =
  "h-9 rounded-md border-stroke-default bg-surface-white text-sm"
const NUMBER_FIELD_CLASS = `${FIELD_CLASS} font-mono`
const TRIGGER_CLASS = `${FIELD_CLASS} shadow-xs`
const ERROR_CLASS = "text-xs text-brand-danger"

/** The shared schema carries English messages; map the known ones to keys for display. */
const SCHEMA_ERROR_KEYS = {
  "Must be greater than 0": "errorPositive",
  "Programme code is required": "errorCodeRequired",
  "Programme name is required": "errorNameRequired",
  "Please select a category": "errorCategoryRequired",
  "Please select a status": "errorStatusRequired",
  "Currency code must be 3 characters (ISO 4217)": "errorCurrencyLength",
  "End date must be on or after the start date": "errorEndBeforeStart",
} as const

function isSchemaErrorMessage(
  message: string,
): message is keyof typeof SCHEMA_ERROR_KEYS {
  return message in SCHEMA_ERROR_KEYS
}

/** Drops blanks and NaNs so the payload only carries values the user supplied. */
function toPayload(values: TrainingProgramFormValues): CreateProgramPayload {
  const text = (v?: string) => {
    const trimmed = v?.trim()
    return trimmed ? trimmed : undefined
  }
  const num = (v?: number) =>
    v === undefined || Number.isNaN(v) ? undefined : v

  return {
    program_code: values.program_code.trim().toUpperCase(),
    program_name: values.program_name.trim(),
    category: values.category,
    status: values.status,
    provider: text(values.provider),
    target_audience: text(values.target_audience),
    total_duration_hours: num(values.total_duration_hours),
    cost_per_seat: num(values.cost_per_seat),
    currency_code: values.currency_code.trim().toUpperCase(),
    max_cohort_size: num(values.max_cohort_size),
    start_date: text(values.start_date),
    end_date: text(values.end_date),
    description: text(values.description),
    is_active: values.status === "active",
  }
}

export function NewProgramDialog({
  open,
  onOpenChange,
}: NewProgramDialogProps) {
  const t = useTranslations("HrTraining")
  const tCommon = useTranslations("Common")
  const createProgram = useCreateProgram()

  const form = useForm<TrainingProgramFormValues>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      program_code: "",
      program_name: "",
      category: "development",
      status: "draft",
      provider: "",
      target_audience: "",
      total_duration_hours: undefined,
      cost_per_seat: undefined,
      currency_code: "USD",
      max_cohort_size: undefined,
      start_date: "",
      end_date: "",
      description: "",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = form

  const selectedCategory = useWatch({ control, name: "category" })
  const selectedStatus = useWatch({ control, name: "status" })

  const errorText = (message?: string) =>
    message && isSchemaErrorMessage(message)
      ? t(SCHEMA_ERROR_KEYS[message])
      : message

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: TrainingProgramFormValues) => {
    createProgram.mutate(toPayload(values), {
      onSuccess: (program) => {
        toast.success(t("programmeCreated", { name: program.program_name }))
        handleOpenChange(false)
      },
      onError: (err) => {
        const apiErr = err as unknown as { message?: string }
        toast.error(t("programmeCreateFailed"), {
          description: apiErr.message ?? t("checkDetailsRetry"),
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {t("newProgramme")}
            </DialogTitle>
            <p className="text-sm leading-5 text-content-quaternary">
              {t("newProgrammeSubtitle")}
            </p>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("programmeName")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("program_name")}
                placeholder={t("programmeNamePlaceholder")}
                className={FIELD_CLASS}
              />
              {errors.program_name && (
                <p className={ERROR_CLASS}>{errorText(errors.program_name.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("programmeCode")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("program_code")}
                placeholder={t("programmeCodePlaceholder")}
                className={`${NUMBER_FIELD_CLASS} uppercase`}
                onChange={(e) =>
                  setValue("program_code", e.target.value.toUpperCase())
                }
              />
              {errors.program_code && (
                <p className={ERROR_CLASS}>{errorText(errors.program_code.message)}</p>
              )}
            </div>
          </div>

          {/* Category & status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("colCategory")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) =>
                  setValue(
                    "category",
                    val as TrainingProgramFormValues["category"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className={TRIGGER_CLASS}>
                  <SelectValue placeholder={tCommon("select")} />
                </SelectTrigger>
                <SelectContent>
                  {programCategoryValues.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className={ERROR_CLASS}>{errorText(errors.category.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {tCommon("status")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(val) =>
                  setValue("status", val as TrainingProgramFormValues["status"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className={TRIGGER_CLASS}>
                  <SelectValue placeholder={tCommon("select")} />
                </SelectTrigger>
                <SelectContent>
                  {programStatusValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`programStatus.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className={ERROR_CLASS}>{errorText(errors.status.message)}</p>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("provider")}
              </Label>
              <Input
                {...register("provider")}
                placeholder={t("providerPlaceholder")}
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("targetAudience")}
              </Label>
              <Input
                {...register("target_audience")}
                placeholder={t("targetAudiencePlaceholder")}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          {/* Capacity & cost */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-content-tertiary">{t("hours")}</Label>
              <Input
                {...register("total_duration_hours", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="24"
                className={NUMBER_FIELD_CLASS}
              />
              {errors.total_duration_hours && (
                <p className={ERROR_CLASS}>
                  {errorText(errors.total_duration_hours.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-content-tertiary">{t("costPerSeatShort")}</Label>
              <Input
                {...register("cost_per_seat", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="1200"
                className={NUMBER_FIELD_CLASS}
              />
              {errors.cost_per_seat && (
                <p className={ERROR_CLASS}>{errorText(errors.cost_per_seat.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-content-tertiary">{t("currency")}</Label>
              <Input
                {...register("currency_code")}
                maxLength={3}
                placeholder="USD"
                className={`${NUMBER_FIELD_CLASS} uppercase`}
              />
              {errors.currency_code && (
                <p className={ERROR_CLASS}>{errorText(errors.currency_code.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-content-tertiary">{t("cohortMax")}</Label>
              <Input
                {...register("max_cohort_size", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="25"
                className={NUMBER_FIELD_CLASS}
              />
              {errors.max_cohort_size && (
                <p className={ERROR_CLASS}>{errorText(errors.max_cohort_size.message)}</p>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("startDate")}
              </Label>
              <Input
                {...register("start_date")}
                type="date"
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("endDate")}
              </Label>
              <Input
                {...register("end_date")}
                type="date"
                className={FIELD_CLASS}
              />
              {errors.end_date && (
                <p className={ERROR_CLASS}>{errorText(errors.end_date.message)}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-content-primary">
              {tCommon("description")}
            </Label>
            <Textarea
              {...register("description")}
              placeholder={t("descriptionPlaceholder")}
              rows={2}
              className="max-h-18 min-h-16 w-full resize-none rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md border-stroke-default bg-surface-white px-4 text-sm font-semibold text-content-primary"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createProgram.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createProgram.isPending ? t("saving") : t("createProgramme")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
