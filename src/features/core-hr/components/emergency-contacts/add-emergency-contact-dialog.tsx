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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useCreateEmergencyContact } from "../../lib/mutations/emergency-contacts"
import {
  emergencyContactSchema,
  type EmergencyContactFormValues,
} from "../../lib/schema/emergency-contact"
import type { EmployeeListItem } from "../../lib/types"

type AddEmergencyContactDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: EmployeeListItem[]
  employeesLoading?: boolean
}>

const DEFAULT_VALUES: EmergencyContactFormValues = {
  full_name: "",
  relationship: "",
  phone_primary: "",
  is_primary: false,
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

export function AddEmergencyContactDialog({
  open,
  onOpenChange,
  employees,
  employeesLoading = false,
}: AddEmergencyContactDialogProps) {
  const createContact = useCreateEmergencyContact()
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")

  const form = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: DEFAULT_VALUES,
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

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      reset(DEFAULT_VALUES)
      setSelectedEmployeeId("")
    }
  }

  const onSubmit = (values: EmergencyContactFormValues) => {
    if (!selectedEmployeeId) {
      toast.error("Please select an employee")
      return
    }

    const payload = {
      full_name: values.full_name,
      ...(values.full_name_local ? { full_name_local: values.full_name_local } : {}),
      relationship: values.relationship,
      phone_primary: values.phone_primary,
      ...(values.phone_secondary ? { phone_secondary: values.phone_secondary } : {}),
      ...(values.email ? { email: values.email } : {}),
      ...(values.address ? { address: values.address } : {}),
      ...(values.national_id ? { national_id: values.national_id } : {}),
      is_primary: values.is_primary,
    }

    createContact.mutate(
      { employeeId: selectedEmployeeId, payload },
      {
        onSuccess: (contact) => {
          toast.success("Contact added", { description: contact.full_name })
          handleOpenChange(false)
        },
        onError: (err) => {
          toast.error("Failed to add contact", {
            description: apiErrorDescription(err),
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              Add emergency contact
            </DialogTitle>
            <p className="text-content-tertiary text-sm leading-5">
              Register a new emergency contact for an employee
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-content-primary">
                Employee <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedEmployeeId || undefined}
                onValueChange={setSelectedEmployeeId}
                disabled={employeesLoading || employees.length === 0}
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                  <SelectValue
                    placeholder={
                      employeesLoading
                        ? "Loading employees..."
                        : "Select employee..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="ec-name"
                className="text-sm font-semibold text-content-primary"
              >
                Name <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="ec-name"
                {...register("full_name")}
                placeholder="Full name"
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
                htmlFor="ec-relationship"
                className="text-sm font-semibold text-content-primary"
              >
                Relationship <span className="text-brand-danger">*</span>
              </Label>
              <Input
                id="ec-relationship"
                {...register("relationship")}
                placeholder="e.g. Spouse, Parent, Sibling"
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
                  htmlFor="ec-phone"
                  className="text-sm font-semibold text-content-primary"
                >
                  Phone <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  id="ec-phone"
                  type="tel"
                  {...register("phone_primary")}
                  placeholder="+20-100-000-0000"
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
                  htmlFor="ec-phone2"
                  className="text-sm font-semibold text-content-primary"
                >
                  Secondary phone
                </Label>
                <Input
                  id="ec-phone2"
                  type="tel"
                  {...register("phone_secondary")}
                  placeholder="+20-100-000-0001"
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
                htmlFor="ec-email"
                className="text-sm font-semibold text-content-primary"
              >
                Email
              </Label>
              <Input
                id="ec-email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
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
                htmlFor="ec-address"
                className="text-sm font-semibold text-content-primary"
              >
                Address
              </Label>
              <Input
                id="ec-address"
                {...register("address")}
                placeholder="Street, city"
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ec-primary"
                checked={isPrimary}
                onCheckedChange={(v) =>
                  setValue("is_primary", v === true, { shouldValidate: true })
                }
              />
              <Label
                htmlFor="ec-primary"
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
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createContact.isPending}
              className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createContact.isPending ? "Adding..." : "Add contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
