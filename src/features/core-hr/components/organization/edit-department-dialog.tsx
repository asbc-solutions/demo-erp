"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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

import type { Department } from "../../lib/types"
import { useUpdateDepartment } from "../../lib/mutations/departments"
import { useDepartment } from "../../lib/queries/departments"
import { useActiveBranchOptions } from "../../lib/queries/org-selectors"
import {
  departmentSchema,
  type DepartmentFormValues,
} from "../../lib/schema/department"

type EditDepartmentDialogProps = Readonly<{
  department: Department | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
}: EditDepartmentDialogProps) {
  const updateDepartment = useUpdateDepartment()
  const { data: branchData } = useActiveBranchOptions({ enabled: open })
  const branches = branchData?.data ?? []
  // headcount_budget only lives on the full record, not always on the list item.
  const { data: detail } = useDepartment(open && department ? department.id : "")

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

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    reset,
    formState: { errors },
  } = form

  // Prefill instantly from the list item…
  useEffect(() => {
    if (!department) return
    reset({
      branch_id: department.branch_id,
      dept_code: department.dept_code,
      dept_name: department.dept_name,
      dept_type: department.dept_type,
      headcount_budget: department.headcount?.budget ?? 1,
      effective_date: department.effective_date,
      is_active: department.is_active,
      parent_dept_id: department.parent_dept_id,
    })
  }, [department, reset])

  // …then enrich with the full record once it loads (headcount budget, etc.).
  useEffect(() => {
    if (!detail) return
    reset({
      branch_id: detail.branch_id,
      dept_code: detail.dept_code,
      dept_name: detail.dept_name,
      dept_name_local: detail.dept_name_local ?? "",
      dept_type: detail.dept_type,
      headcount_budget: detail.headcount?.budget ?? 1,
      effective_date: detail.effective_date,
      is_active: detail.is_active,
      parent_dept_id: detail.parent_dept_id,
    })
  }, [detail, reset])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: DepartmentFormValues) => {
    if (!department) return
    updateDepartment.mutate(
      { id: department.id, payload: values },
      {
        onSuccess: (updated) => {
          toast.success(`Department "${updated.dept_name}" updated`)
          handleOpenChange(false)
        },
        onError: (err) => {
          const apiErr = err as Partial<ApiError>
          const isCodeConflict =
            apiErr.code === "CONFLICT" || apiErr.code === "409"
          const fieldErrors = (
            apiErr.details as { fields?: Record<string, string[]> } | undefined
          )?.fields

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
                ? `Code "${values.dept_code}" is already in use. Please enter a unique code.`
                : "Please check your details and try again."))
          if (isCodeConflict && !fieldErrors) {
            setError("dept_code", { type: "server", message: description })
          }
          toast.error("Failed to update department", { description })
        },
      },
    )
  }

  if (!department) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-content-primary text-lg font-semibold">
              Edit Department
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              Edit a department
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                Name <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("dept_name")}
                placeholder="Department name"
                className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.dept_name && (
                <p className="text-brand-danger text-xs">
                  {errors.dept_name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                Code <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("dept_code")}
                placeholder="DEPT_CODE"
                className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm uppercase"
                onChange={(e) => {
                  setValue("dept_code", e.target.value.toUpperCase())
                  clearErrors("dept_code")
                }}
              />
              {errors.dept_code && (
                <p className="text-brand-danger text-xs">
                  {errors.dept_code.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                Branch <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={watch("branch_id") || undefined}
                onValueChange={(val) =>
                  setValue("branch_id", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue placeholder="Select…" />
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
                  {errors.branch_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-content-primary h-9 rounded-md border-stroke-default bg-surface-white px-4 text-sm font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateDepartment.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {updateDepartment.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
