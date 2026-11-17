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

import { useCreatePosition } from "../../lib/mutations/positions"
import {
  useActiveBranchOptions,
  useActiveDepartmentOptions,
} from "../../lib/queries/org-selectors"
import {
  createPositionSchema,
  type CreatePositionFormValues,
} from "../../lib/schema/position"
import { useFieldError } from "../../lib/hooks/use-field-error"

type CreatePositionDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function CreatePositionDialog({
  open,
  onOpenChange,
}: CreatePositionDialogProps) {
  const t = useTranslations("HrPositions")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const createPosition = useCreatePosition()
  const { data: branchData } = useActiveBranchOptions({ enabled: open })
  const { data: deptData } = useActiveDepartmentOptions({ enabled: open })
  const branches = branchData?.data ?? []
  const departments = deptData?.data ?? []

  const form = useForm<CreatePositionFormValues>({
    resolver: zodResolver(createPositionSchema),
    defaultValues: {
      position_title: "",
      position_code: "",
      dept_id: null,
      branch_id: null,
      headcount_budget: 1,
      is_budgeted: true,
      effective_date: null,
      is_active: true,
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = form

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: CreatePositionFormValues) => {
    createPosition.mutate(values, {
      onSuccess: (pos) => {
        toast.success(t("createdToast", { title: pos.position_title }))
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
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {t("createPosition")}
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              {t("createSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("fieldTitle")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("position_title")}
                placeholder={t("phTitle")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
              />
              {errors.position_title && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.position_title.message)}
                </p>
              )}
            </div>

            {/* Code */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                {t("colCode")}
                <span className="text-content-quaternary ms-1.5 text-[11px] font-normal">
                  {t("codeAutoHint")}
                </span>
              </Label>
              <Input
                {...register("position_code")}
                placeholder="POS-ENG-001"
                className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm placeholder:text-content-quaternary"
              />
            </div>

            {/* Department & Branch */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("department")}
                </Label>
                <Select
                  value={watch("dept_id") ?? ""}
                  onValueChange={(val) =>
                    setValue("dept_id", val || null, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                    <SelectValue placeholder={t("phSelect")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.dept_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dept_id && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.dept_id.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("branch")}
                </Label>
                <Select
                  value={watch("branch_id") ?? ""}
                  onValueChange={(val) =>
                    setValue("branch_id", val || null, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                    <SelectValue placeholder={t("phSelect")} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Headcount & Effective Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldHeadcountBudget")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("headcount_budget", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1"
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.headcount_budget && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.headcount_budget.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  {t("fieldEffectiveDate")}
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
              disabled={createPosition.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createPosition.isPending ? t("creating") : tCommon("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
