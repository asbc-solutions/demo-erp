"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2 } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Switch } from "@/src/shared/components/ui/switch"

import { toastMutationError } from "../../components/shared/sales-error-state"
import { useCreateCustomer } from "../../lib/mutations/customers"
import { useActiveSalespeople } from "../../lib/queries/salespeople"
import { useCustomerDirectory } from "../../lib/queries/customers"
import {
  buildBillingAddress,
  CUSTOMER_FORM_DEFAULT_VALUES,
  customerFormSchema,
  type CustomerFormValues,
} from "../../lib/schema/customer"
import type { CreateCustomerPayload } from "../../lib/types"
import { CustomerFormFields } from "./customer-form-fields"

export function NewCustomerDialog({
  open,
  onOpenChange,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>) {
  const { data: salespeople = [] } = useActiveSalespeople({ enabled: open })
  const createCustomer = useCreateCustomer()
  const { data: customerDirectory = [], isLoading: isDirectoryLoading } = useCustomerDirectory({ enabled: open })

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: CUSTOMER_FORM_DEFAULT_VALUES,
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) form.reset(CUSTOMER_FORM_DEFAULT_VALUES)
  }

  const onSubmit = (values: CustomerFormValues) => {
    const normalizedEmail = values.email.trim().toLocaleLowerCase()
    if (
      customerDirectory.some(
        (customer) => customer.email.trim().toLocaleLowerCase() === normalizedEmail
      )
    ) {
      form.setError("email", { message: "This email address is already in use." }, { shouldFocus: true })
      return
    }

    const payload: CreateCustomerPayload = {
      name: values.name,
      customer_type: values.customer_type,
      phone: values.phone,
      email: values.email,
      tax_number: values.tax_number || undefined,
      assigned_salesperson_id: values.assigned_salesperson_id,
      addresses: buildBillingAddress(values),
    }

    createCustomer.mutate(payload, {
      onSuccess: () => {
        toast.success("Customer added.")
        handleOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to add customer"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
              <DialogDescription>
                Create a customer profile to begin creating quotations and orders.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CustomerFormFields salespeople={salespeople} />
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-content-secondary">Status</span>
                <div className="flex items-center gap-2">
                  <Switch checked disabled aria-label="New customers start active" />
                  <span className="text-sm text-content-primary">Active</span>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createCustomer.isPending || isDirectoryLoading}
              >
                {createCustomer.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Check aria-hidden />
                )}
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
