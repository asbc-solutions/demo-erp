"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { Check, Loader2 } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"

import { toastMutationError } from "../../components/shared/sales-error-state"
import { useUpdateCustomer } from "../../lib/mutations/customers"
import { useActiveSalespeople } from "../../lib/queries/salespeople"
import { withCurrentSalesperson } from "../../lib/utils/salespeople"
import { useCustomerDirectory } from "../../lib/queries/customers"
import {
  buildBillingAddress,
  customerFormSchema,
  type CustomerFormValues,
} from "../../lib/schema/customer"
import type { Customer, UpdateCustomerPayload } from "../../lib/types"
import { CustomerFormFields } from "./customer-form-fields"

function toFormValues(customer: Customer): CustomerFormValues {
  const billingAddress = customer.addresses.find((address) => address.address_type === "billing")
  return {
    name: customer.name,
    customer_type: customer.customer_type,
    phone: customer.phone,
    email: customer.email,
    tax_number: customer.tax_number ?? "",
    assigned_salesperson_id: customer.assigned_salesperson_id,
    address_line: billingAddress?.line ?? "",
    address_city: billingAddress?.city ?? "",
    address_governorate: billingAddress?.governorate ?? "",
  }
}

export function EditCustomerForm({
  customer,
  onOpenChange,
}: Readonly<{ customer: Customer; onOpenChange: (open: boolean) => void }>) {
  const { data: salespeople = [] } = useActiveSalespeople()
  const updateCustomer = useUpdateCustomer()
  const salespersonOptions = useMemo(
    () =>
      withCurrentSalesperson(salespeople, {
        id: customer.assigned_salesperson_id,
        name: customer.assigned_salesperson_name,
      }),
    [salespeople, customer.assigned_salesperson_id, customer.assigned_salesperson_name],
  )
  const { data: customerDirectory = [], isLoading: isDirectoryLoading } = useCustomerDirectory()
  const billingAddress = customer.addresses.find(
    (address) => address.address_type === "billing",
  )

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toFormValues(customer),
  })

  const onSubmit = (values: CustomerFormValues) => {
    const normalizedEmail = values.email.trim().toLocaleLowerCase()
    if (
      customerDirectory.some(
        (entry) =>
          entry.id !== customer.id &&
          entry.email.trim().toLocaleLowerCase() === normalizedEmail
      )
    ) {
      form.setError("email", { message: "This email address is already in use." }, { shouldFocus: true })
      return
    }

    const payload: UpdateCustomerPayload = {
      name: values.name,
      customer_type: values.customer_type,
      phone: values.phone,
      email: values.email,
      tax_number: values.tax_number || undefined,
      assigned_salesperson_id: values.assigned_salesperson_id,
      addresses: buildBillingAddress(values, billingAddress),
    }

    updateCustomer.mutate(
      { id: customer.id, payload },
      {
        onSuccess: () => {
          toast.success("Customer updated.")
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, "Failed to update customer"),
      }
    )
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <DialogHeader>
          <DialogTitle>Edit Customer — {customer.name}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CustomerFormFields salespeople={salespersonOptions} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={updateCustomer.isPending || isDirectoryLoading}
          >
            {updateCustomer.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check aria-hidden />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  )
}
