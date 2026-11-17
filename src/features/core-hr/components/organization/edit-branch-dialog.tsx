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
import type { ApiError } from "@/src/shared/lib/types/api"

import type { BranchListItem } from "../../lib/types"
import { useUpdateBranch } from "../../lib/mutations/branches"
import { useBranch } from "../../lib/queries/branches"
import { branchSchema, type BranchFormValues } from "../../lib/schema/branch"
import { useFieldError } from "../../lib/hooks/use-field-error"

type EditBranchDialogProps = Readonly<{
  branch: BranchListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function EditBranchDialog({
  branch,
  open,
  onOpenChange,
}: EditBranchDialogProps) {
  const t = useTranslations("HrOrganization")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  const updateBranch = useUpdateBranch()
  // Address/city/country only live on the full branch record, not the list item.
  const { data: detail } = useBranch(open && branch ? branch.id : "")

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

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = form

  // Prefill instantly from the list item (name / code / type)…
  useEffect(() => {
    if (!branch) return
    reset({
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      branch_type: branch.branch_type,
      country_code: "",
      city: "",
      address_line1: "",
      is_head_office: branch.is_head_office,
      is_active: branch.is_active,
    })
  }, [branch, reset])

  // …then enrich with the full record once it loads (address, contacts, etc.).
  useEffect(() => {
    if (!detail) return
    reset({
      branch_code: detail.branch_code,
      branch_name: detail.branch_name,
      branch_name_local: detail.branch_name_local ?? "",
      branch_type: detail.branch_type,
      parent_branch_id: detail.parent_branch_id,
      country_code: detail.contacts.address.country_code,
      city: detail.contacts.address.city,
      address_line1: detail.contacts.address.line1,
      address_line2: detail.contacts.address.line2 ?? "",
      postal_code: detail.contacts.address.postal_code ?? "",
      phone: detail.contacts.phone ?? "",
      email: detail.contacts.email ?? "",
      is_head_office: detail.is_head_office,
      is_active: detail.is_active,
      established_date: detail.established_date,
    })
  }, [detail, reset])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const onSubmit = (values: BranchFormValues) => {
    if (!branch) return
    updateBranch.mutate(
      { id: branch.id, payload: values },
      {
        onSuccess: (updated) => {
          toast.success(t("branchUpdated", { name: updated.branch_name }))
          handleOpenChange(false)
        },
        onError: (err) => {
          const apiErr = err as Partial<ApiError>
          const isCodeConflict =
            apiErr.code === "CONFLICT" || apiErr.code === "409"
          const description =
            apiErr.message ??
            (isCodeConflict
              ? t("codeInUse", { code: values.branch_code })
              : t("checkDetails"))
          if (isCodeConflict) {
            setError("branch_code", { type: "server", message: description })
          }
          toast.error(t("updateBranchFailed"), { description })
        },
      },
    )
  }

  if (!branch) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-content-primary text-lg font-semibold">
              {t("editBranch")}
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              {t("editBranchSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldName")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("branch_name")}
                placeholder={t("phBranchName")}
                className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.branch_name && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.branch_name.message)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldCode")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("branch_code")}
                placeholder="BRANCH_CODE"
                className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm uppercase"
                onChange={(e) => {
                  setValue("branch_code", e.target.value.toUpperCase())
                  clearErrors("branch_code")
                }}
              />
              {errors.branch_code && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.branch_code.message)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                {t("fieldAddress")} <span className="text-brand-danger">*</span>
              </Label>
              <Input
                {...register("address_line1")}
                placeholder={t("phStreetAddress")}
                className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.address_line1 && (
                <p className="text-brand-danger text-xs">
                  {fieldError(errors.address_line1.message)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-primary text-sm font-semibold">
                  {t("fieldCity")} <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("city")}
                  placeholder={t("phCity")}
                  className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white text-sm"
                />
                {errors.city && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.city.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-primary text-sm font-semibold">
                  Country <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("country_code")}
                  placeholder="US"
                  maxLength={2}
                  className="placeholder:text-content-quaternary h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm uppercase"
                  onChange={(e) =>
                    setValue(
                      "country_code",
                      e.target.value.toUpperCase().slice(0, 2),
                    )
                  }
                />
                {errors.country_code && (
                  <p className="text-brand-danger text-xs">
                    {fieldError(errors.country_code.message)}
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
              className="text-content-primary h-9 rounded-md border-stroke-default bg-surface-white px-4 text-sm font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateBranch.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {updateBranch.isPending ? tShared("saving") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
