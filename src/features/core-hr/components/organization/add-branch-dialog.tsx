"use client"

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

import { useCreateBranch } from "../../lib/mutations/branches"
import {
  branchSchema,
  branchTypeValues,
  type BranchFormValues,
} from "../../lib/schema/branch"

type AddBranchDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

const BRANCH_TYPE_LABEL: Record<typeof branchTypeValues[number], string> = {
  head_office: "Head Office",
  regional_office: "Regional Office",
  branch: "Branch",
  warehouse: "Warehouse",
  site: "Site",
}

export function AddBranchDialog({ open, onOpenChange }: AddBranchDialogProps) {
  const createBranch = useCreateBranch()

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branch_code: "",
      branch_name: "",
      branch_type: "branch",
      country_code: "",
      city: "",
      address_line1: "",
      is_head_office: false,
      is_active: true,
    },
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) form.reset()
  }

  const onSubmit = (values: BranchFormValues) => {
    createBranch.mutate(values, {
      onSuccess: (branch) => {
        toast.success(`Branch "${branch.branch_name}" created`)
        handleOpenChange(false)
      },
      onError: (err, variables) => {
        const apiErr = err as Partial<ApiError>
        const isCodeConflict =
          apiErr.code === "CONFLICT" || apiErr.code === "409"
        const description =
          apiErr.message ??
          (isCodeConflict
            ? `Code "${variables.branch_code}" is already in use. Please enter a unique code.`
            : "Please check your details and try again.")
        // Pin a conflict to the offending Code field so it's clear what to fix.
        if (isCodeConflict) {
          setError("branch_code", { type: "server", message: description })
        }
        toast.error("Failed to create branch", { description })
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
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              Add Branch
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              Create a new branch location
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  Name <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("branch_name")}
                  placeholder="Branch name"
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
                />
                {errors.branch_name && (
                  <p className="text-brand-danger text-xs">
                    {errors.branch_name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  Code <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("branch_code")}
                  placeholder="BRANCH_CODE"
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm placeholder:text-content-quaternary uppercase"
                  onChange={(e) => {
                    setValue("branch_code", e.target.value.toUpperCase())
                    clearErrors("branch_code")
                  }}
                />
                {errors.branch_code && (
                  <p className="text-brand-danger text-xs">
                    {errors.branch_code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                Type <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={watch("branch_type")}
                onValueChange={(val) =>
                  setValue(
                    "branch_type",
                    val as typeof branchTypeValues[number],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {branchTypeValues.map((t) => (
                    <SelectItem key={t} value={t}>
                      {BRANCH_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch_type && (
                <p className="text-brand-danger text-xs">
                  {errors.branch_type.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                Address <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("address_line1")}
                placeholder="Street address"
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
              />
              {errors.address_line1 && (
                <p className="text-brand-danger text-xs">
                  {errors.address_line1.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-content-primary">
                  City <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("city")}
                  placeholder="City"
                  className="h-9 rounded-md border-stroke-default bg-surface-white text-sm placeholder:text-content-quaternary"
                />
                {errors.city && (
                  <p className="text-brand-danger text-xs">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-sm font-semibold text-content-primary">
                  Country Code <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("country_code")}
                  placeholder="US"
                  maxLength={2}
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm uppercase placeholder:text-content-quaternary"
                  onChange={(e) =>
                    setValue(
                      "country_code",
                      e.target.value.toUpperCase().slice(0, 2),
                    )
                  }
                />
                {errors.country_code && (
                  <p className="text-brand-danger text-xs">
                    {errors.country_code.message}
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createBranch.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createBranch.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
