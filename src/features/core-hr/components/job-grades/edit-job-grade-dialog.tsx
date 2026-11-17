"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import type { JobGradeListItem } from "../../lib/types"
import { useUpdateJobGrade } from "../../lib/mutations/job-grades"
import { jobGradeSchema, type JobGradeFormValues } from "../../lib/schema/job-grade"
import { apiErrorMessage } from "../../lib/utils/api-error"
import { useFieldError } from "../../lib/hooks/use-field-error"

type EditJobGradeDialogProps = Readonly<{
  grade: JobGradeListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function EditJobGradeDialog({
  grade,
  open,
  onOpenChange,
}: EditJobGradeDialogProps) {
  const t = useTranslations("HrJobGrades")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const updateJobGrade = useUpdateJobGrade()

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
    reset,
    formState: { errors },
  } = form

  // grade_code is immutable on the backend, and category/currency/entitlements
  // aren't shown in this modal — prefill them all so the PUT payload stays valid.
  useEffect(() => {
    if (!grade) return
    reset({
      grade_code: grade.grade_code,
      grade_name: grade.grade_name,
      grade_level: grade.grade_level,
      grade_category: grade.grade_category,
      min_salary: grade.min_salary,
      mid_salary: grade.mid_salary,
      max_salary: grade.max_salary,
      currency_code: "EGP",
      description: grade.description ?? "",
      overtime_eligible: grade.overtime_eligible,
      annual_leave_days: grade.annual_leave_days,
      sick_leave_days: grade.sick_leave_days,
      is_active: grade.is_active,
    })
  }, [grade, reset])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: JobGradeFormValues) => {
    if (!grade) return
    updateJobGrade.mutate(
      { id: grade.id, payload: { ...values, currency_code: "EGP" } },
      {
        onSuccess: (updated) => {
          toast.success(t("gradeUpdated", { name: updated.grade_name }))
          // The backend warns (doesn't block) when the new band leaves employees
          // outside it — surface that so HR is aware of the impact.
          const outside = (
            updated as { impact_warning?: { employees_outside_band?: number } }
          ).impact_warning?.employees_outside_band
          if (outside && outside > 0) {
            toast.warning(t("employeesOutsideBand", { count: outside }))
          }
          handleOpenChange(false)
        },
        onError: (err) => {
          toast.error(t("updateFailed"), {
            description: apiErrorMessage(err, t("checkDetails")),
          })
        },
      },
    )
  }

  if (!grade) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-content-primary text-lg font-semibold">
              {t("editTitle")}
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              {t("editSubtitle")}
            </p>
          </div>

          {/* Name & Level */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldName")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("grade_name")}
                placeholder={t("phGradeNameShort")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.grade_name && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.grade_name.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
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
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.grade_level.message)}
                </p>
              )}
            </div>
          </div>

          {/* Salary band */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldMinSalary")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("min_salary", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="40000"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.min_salary && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.min_salary.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldMidpoint")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("mid_salary", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="50000"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.mid_salary && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.mid_salary.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldMaxSalary")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("max_salary", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="60000"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
              />
              {errors.max_salary && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.max_salary.message)}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-content-primary text-sm font-semibold">
              {tCommon("description")}
            </Label>
            <Textarea
              {...register("description")}
              placeholder={t("phDescription")}
              rows={2}
              className="placeholder:text-content-quaternary max-h-28 min-h-16 w-full resize-none rounded-md border-stroke-default bg-surface-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-content-primary h-9 rounded-md border-stroke-default bg-surface-white px-4 text-sm font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateJobGrade.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {updateJobGrade.isPending ? tShared("saving") : tCommon("update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
