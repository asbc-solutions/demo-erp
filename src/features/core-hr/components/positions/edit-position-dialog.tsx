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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import type { PositionListItem } from "../../lib/types"
import { useUpdatePosition } from "../../lib/mutations/positions"
import {
  useActiveBranchOptions,
  useActiveDepartmentOptions,
} from "../../lib/queries/org-selectors"
import {
  createPositionSchema,
  type CreatePositionFormValues,
} from "../../lib/schema/position"
import { useFieldError } from "../../lib/hooks/use-field-error"

type EditPositionDialogProps = Readonly<{
  position: PositionListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function EditPositionDialog({
  position,
  open,
  onOpenChange,
}: EditPositionDialogProps) {
  const t = useTranslations("HrPositions")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const updatePosition = useUpdatePosition()
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

  // Sync form when position changes
  useEffect(() => {
    if (position) {
      reset({
        position_title: position.position_title,
        position_code: position.position_code,
        dept_id: position.dept_id,
        branch_id: position.branch_id,
        headcount_budget: position.headcount_budget,
        is_budgeted: position.is_budgeted,
        effective_date: null,
        is_active: position.is_active,
      })
    }
  }, [position, reset])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: CreatePositionFormValues) => {
    if (!position) return
    updatePosition.mutate(
      { id: position.id, payload: values },
      {
        onSuccess: (pos) => {
          toast.success(t("updatedToast", { title: pos.position_title }))
          handleOpenChange(false)
        },
        onError: (err) => {
          const apiErr = err as unknown as { code?: string; message?: string }
          if (apiErr.code === "BUSINESS_RULE_VIOLATION") {
            toast.error(t("cannotReduceHeadcount"), {
              description: apiErr.message,
            })
          } else {
            toast.error(t("updateFailed"), {
              description: apiErr.message ?? t("checkDetails"),
            })
          }
        },
      },
    )
  }

  if (!position) return null

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
              {t("editPosition")}
            </DialogTitle>
            <p className="text-content-quaternary font-mono text-xs">
              {position.position_code}
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
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.headcount_budget && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.headcount_budget.message)}
                  </p>
                )}
                {position.headcount_filled > 0 && (
                  <p className="text-content-quaternary text-xs">
                    {t("minFilledHint", { count: position.headcount_filled })}
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
              disabled={updatePosition.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {updatePosition.isPending ? tShared("saving") : tCommon("saveChanges")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
