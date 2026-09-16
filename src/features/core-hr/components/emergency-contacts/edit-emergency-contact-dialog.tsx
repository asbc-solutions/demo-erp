"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useUpdateEmergencyContact } from "../../lib/mutations/emergency-contacts"
import {
  emergencyContactSchema,
  type EmergencyContactFormValues,
} from "../../lib/schema/emergency-contact"
import type { EmergencyContact } from "../../lib/types"

type EditEmergencyContactDialogProps = Readonly<{
  contact: EmergencyContact | null
  onOpenChange: (open: boolean) => void
}>

function toFormValues(contact: EmergencyContact): EmergencyContactFormValues {
  return {
    full_name: contact.full_name,
    full_name_local: contact.full_name_local ?? undefined,
    relationship: contact.relationship,
    phone_primary: contact.phone_primary,
    phone_secondary: contact.phone_secondary ?? undefined,
    email: contact.email ?? undefined,
    address: contact.address ?? undefined,
    national_id: contact.national_id ?? undefined,
    is_primary: contact.is_primary,
  }
}

function apiErrorDescription(err: unknown) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    return Object.entries(fields)
      .map(([field, messages]) => `${field.replace(/_/g, " ")}: ${messages[0]}`)
      .join(" | ")
  }
  return apiErr.message ?? "Please check the details and try again."
}

export function EditEmergencyContactDialog({
  contact,
  onOpenChange,
}: EditEmergencyContactDialogProps) {
  const updateContact = useUpdateEmergencyContact()

  const form = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: contact ? toFormValues(contact) : undefined,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form

  const isPrimary = watch("is_primary")

  React.useEffect(() => {
    if (contact) reset(toFormValues(contact))
  }, [contact, reset])

  const handleClose = () => onOpenChange(false)

  const onSubmit = (values: EmergencyContactFormValues) => {
    if (!contact) return

    const payload = {
      full_name: values.full_name,
      ...(values.full_name_local ? { full_name_local: values.full_name_local } : {}),
      relationship: values.relationship,
      phone_primary: values.phone_primary,
      ...(values.phone_secondary ? { phone_secondary: values.phone_secondary } : {}),
      email: values.email || undefined,
      address: values.address || undefined,
      national_id: values.national_id || undefined,
      is_primary: values.is_primary,
    }

    updateContact.mutate(
      { employeeId: contact.employee_id, id: contact.id, payload },
      {
        onSuccess: (updated) => {
          toast.success("Contact updated", { description: updated.full_name })
          handleClose()
        },
        onError: (err) => {
          toast.error("Failed to update contact", {
            description: apiErrorDescription(err),
          })
        },
      }
    )
  }

  return (
    <Dialog open={!!contact} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              Edit emergency contact
            </DialogTitle>
            <p className="text-content-tertiary text-sm leading-5">
              Update contact details for{" "}
              <span className="font-medium text-content-secondary">
                {contact?.full_name}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="ec-edit-name"
                className="text-sm font-semibold text-content-primary"
              >
                Name <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="ec-edit-name"
                {...register("full_name")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.full_name && (
                <p className="text-xs text-brand-danger">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="ec-edit-relationship"
                className="text-sm font-semibold text-content-primary"
              >
                Relationship <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="ec-edit-relationship"
                {...register("relationship")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.relationship && (
                <p className="text-xs text-brand-danger">
                  {errors.relationship.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="ec-edit-phone"
                  className="text-sm font-semibold text-content-primary"
                >
                  Phone <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  id="ec-edit-phone"
                  type="tel"
                  {...register("phone_primary")}
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.phone_primary && (
                  <p className="text-xs text-brand-danger">
                    {errors.phone_primary.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="ec-edit-phone2"
                  className="text-sm font-semibold text-content-primary"
                >
                  Secondary phone
                </Label>
                <Input
                  id="ec-edit-phone2"
                  type="tel"
                  {...register("phone_secondary")}
                  className="h-9 rounded-md border-stroke-default bg-surface-white font-mono text-sm"
                />
                {errors.phone_secondary && (
                  <p className="text-xs text-brand-danger">
                    {errors.phone_secondary.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="ec-edit-email"
                className="text-sm font-semibold text-content-primary"
              >
                Email
              </Label>
              <Input
                id="ec-edit-email"
                type="email"
                {...register("email")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
              {errors.email && (
                <p className="text-xs text-brand-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="ec-edit-address"
                className="text-sm font-semibold text-content-primary"
              >
                Address
              </Label>
              <Input
                id="ec-edit-address"
                {...register("address")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ec-edit-primary"
                checked={isPrimary}
                onCheckedChange={(v) =>
                  setValue("is_primary", v === true, { shouldValidate: true })
                }
              />
              <Label
                htmlFor="ec-edit-primary"
                className="cursor-pointer text-sm font-semibold text-content-primary"
              >
                Mark as primary contact
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md px-4 text-sm font-semibold"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateContact.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {updateContact.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
