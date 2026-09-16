"use client"

import { Loader2 } from "lucide-react"

import { Dialog, DialogContent } from "@/src/shared/components/ui/dialog"

import { useCustomer } from "../../lib/queries/customers"
import { EditCustomerForm } from "./edit-customer-form"

export function EditCustomerDialog({
  customerId,
  open,
  onOpenChange,
}: Readonly<{
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>) {
  const { data: customer, isLoading } = useCustomer(customerId ?? "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {isLoading || !customer ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-brand-primary" aria-hidden />
          </div>
        ) : (
          <EditCustomerForm key={customer.id} customer={customer} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  )
}
