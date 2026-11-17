"use client"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useCreateDepartment } from "../../lib/mutations/departments"
import { useActiveBranchOptions } from "../../lib/queries/org-selectors"
import {
  departmentSchema,
  deptTypeValues,
  type DepartmentFormValues,
} from "../../lib/schema/department"
import { useFieldError } from "../../lib/hooks/use-field-error"

type AddDepartmentDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function AddDepartmentDialog({
  open,
  onOpenChange,
}: AddDepartmentDialogProps) {
  const t = useTranslations("HrOrganization")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const createDepartment = useCreateDepartment()
  const { data: branchData } = useActiveBranchOptions({ enabled: open })
  const branches = branchData?.data ?? []

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      branch_id: "",
      dept_code: "",
      dept_name: "",
      dept_type: "operational",
      headcount_budget: 1,
      effective_date: new Date().toISOString().slice(0, 10),
      is_active: true,
    },
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) form.reset()
  }

  const onSubmit = (values: DepartmentFormValues) => {
    createDepartment.mutate(values, {
      onSuccess: (dept) => {
        toast.success(t("deptCreated", { name: dept.dept_name }))
        handleOpenChange(false)
      },
      onError: (err, variables) => {
        const apiErr = err as Partial<ApiError>
        const isCodeConflict =
          apiErr.code === "CONFLICT" || apiErr.code === "409"
        const fieldErrors = (
          apiErr.details as { fields?: Record<string, string[]> } | undefined
        )?.fields

        // Surface the backend's actual per-field reason instead of the generic
        // "The given data was invalid." wrapper message, and pin it to the field.
        if (fieldErrors) {
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field in form.getValues()) {
              setError(field as keyof DepartmentFormValues, {
                type: "server",
                message: messages[0],
              })
            }
          }
        }

        const description = fieldErrors
          ? Object.values(fieldErrors).flat().join(" ")
          : (apiErr.message ??
            (isCodeConflict
              ? t("codeInUse", { code: variables.dept_code })
              : t("checkDetails")))
        // Pin a conflict to the offending Code field so it's clear what to fix.
        if (isCodeConflict && !fieldErrors) {
          setError("dept_code", { type: "server", message: description })
        }
        toast.error(t("createDeptFailed"), { description })
      },
    })
  }

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = form

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {t("addDepartment")}
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              {t("addDeptSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldName")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("dept_name")}
                  placeholder={t("phDepartmentName")}
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
                />
                {errors.dept_name && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.dept_name.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldCode")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("dept_code")}
                  placeholder="DEPT_CODE"
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm uppercase placeholder:text-content-quaternary"
                  onChange={(e) => {
                    setValue("dept_code", e.target.value.toUpperCase())
                    clearErrors("dept_code")
                  }}
                />
                {errors.dept_code && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.dept_code.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldBranch")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={watch("branch_id") || undefined}
                onValueChange={(val) =>
                  setValue("branch_id", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue placeholder={t("phSelectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.branch_name} ({b.branch_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch_id && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.branch_id.message)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldType")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={watch("dept_type")}
                onValueChange={(val) =>
                  setValue(
                    "dept_type",
                    val as typeof deptTypeValues[number],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue placeholder={t("phSelectType")} />
                </SelectTrigger>
                <SelectContent>
                  {deptTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tShared(`deptType.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dept_type && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.dept_type.message)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldHeadcountBudget")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("headcount_budget", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  placeholder="10"
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
                />
                {errors.headcount_budget && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.headcount_budget.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldEffectiveDate")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("effective_date")}
                  type="date"
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.effective_date && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.effective_date.message)}
                  </p>
                )}
              </div>
            </div>
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
              disabled={createDepartment.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createDepartment.isPending ? tShared("saving") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
