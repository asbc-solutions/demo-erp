"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useCreateJobGrade } from "../../lib/mutations/job-grades"
import {
  gradeCategoryValues,
  jobGradeSchema,
  type JobGradeFormValues,
} from "../../lib/schema/job-grade"
import { useFieldError } from "../../lib/hooks/use-field-error"

type AddJobGradeDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function AddJobGradeDialog({
  open,
  onOpenChange,
}: AddJobGradeDialogProps) {
  const t = useTranslations("HrJobGrades")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const createJobGrade = useCreateJobGrade()

  const form = useForm<JobGradeFormValues>({
    resolver: zodResolver(jobGradeSchema),
    defaultValues: {
      grade_code: "",
      grade_name: "",
      grade_level: 1,
      grade_category: "professional",
      min_salary: undefined,
      mid_salary: undefined,
      max_salary: undefined,
      currency_code: "EGP",
      description: "",
      overtime_eligible: false,
      annual_leave_days: 21,
      sick_leave_days: 10,
      is_active: true,
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
  const selectedGradeCategory = useWatch({
    control,
    name: "grade_category",
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: JobGradeFormValues) => {
    createJobGrade.mutate({ ...values, currency_code: "EGP" }, {
      onSuccess: (grade) => {
        toast.success(t("gradeCreated", { name: grade.grade_name }))
        handleOpenChange(false)
      },
      onError: (err) => {
        const apiErr = err as unknown as { message?: string }
        toast.error(t("createFailed"), {
          description: apiErr.message ?? t("checkDetails"),
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {t("addTitle")}
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              {t("addSubtitle")}
            </p>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldGradeName")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("grade_name")}
                placeholder={t("phGradeName")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.grade_name && (
                <p className="text-brand-danger text-xs">{fieldError(errors.grade_name.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldGradeCode")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("grade_code")}
                placeholder={t("phGradeCode")}
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm uppercase"
                onChange={(e) => setValue("grade_code", e.target.value.toUpperCase())}
              />
              {errors.grade_code && (
                <p className="text-brand-danger text-xs">{fieldError(errors.grade_code.message)}</p>
              )}
            </div>
          </div>

          {/* Level & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldLevel")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("grade_level", { valueAsNumber: true })}
                type="number"
                min={1}
                placeholder="1"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.grade_level && (
                <p className="text-brand-danger text-xs">{fieldError(errors.grade_level.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldCategory")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedGradeCategory}
                onValueChange={(val) =>
                  setValue(
                    "grade_category",
                    val as typeof gradeCategoryValues[number],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue placeholder={t("phSelect")} />
                </SelectTrigger>
                <SelectContent>
                  {gradeCategoryValues.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tShared(`gradeCategory.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade_category && (
                <p className="text-brand-danger text-xs">{fieldError(errors.grade_category.message)}</p>
              )}
            </div>
          </div>

          {/* Salary band */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-content-primary">
              {t("salaryBandAnnual")} <span className="text-brand-danger">*</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-content-tertiary">{t("min")}</Label>
                <Input
                  {...register("min_salary", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="60000"
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.min_salary && (
                  <p className="text-brand-danger text-xs">{fieldError(errors.min_salary.message)}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-content-tertiary">{t("mid")}</Label>
                <Input
                  {...register("mid_salary", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="80000"
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.mid_salary && (
                  <p className="text-brand-danger text-xs">{fieldError(errors.mid_salary.message)}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-content-tertiary">{t("max")}</Label>
                <Input
                  {...register("max_salary", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="100000"
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.max_salary && (
                  <p className="text-brand-danger text-xs">{fieldError(errors.max_salary.message)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldCurrency")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("currency_code")}
                readOnly
                placeholder="EGP"
                maxLength={3}
                className="h-9 w-24 rounded-md border-stroke-default bg-surface-muted font-mono text-sm uppercase"
              />
              {errors.currency_code && (
                <p className="text-brand-danger text-xs">{fieldError(errors.currency_code.message)}</p>
              )}
            </div>
          </div>

          {/* Entitlements */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldAnnualLeaveDays")}
              </Label>
              <Input
                {...register("annual_leave_days", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="21"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.annual_leave_days && (
                <p className="text-brand-danger text-xs">{fieldError(errors.annual_leave_days.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldSickLeaveDays")}
              </Label>
              <Input
                {...register("sick_leave_days", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="10"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.sick_leave_days && (
                <p className="text-brand-danger text-xs">{fieldError(errors.sick_leave_days.message)}</p>
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
              placeholder={t("phDescription")}
              rows={2}
             
              className="min-h-16 text-ellipsis max-h-18 w-full max-w-110 resize-none rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
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
              disabled={createJobGrade.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createJobGrade.isPending ? tShared("saving") : t("saveGrade")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
