"use client"

import * as React from "react"
import { ArrowLeft, Building2, Mail, MapPin, Pencil, Phone, UserRound } from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"
import { useCustomer } from "../../lib/queries/customers"
import type { CustomerAddress } from "../../lib/types"
import { CustomerStatusBadge } from "./customer-status-badge"
import { EditCustomerDialog } from "./edit-customer-dialog"

/** Renders an optional value, falling back to an em dash so empty fields stay aligned. */
function DetailField({
  label,
  value,
  className,
}: Readonly<{ label: string; value: React.ReactNode; className?: string }>) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs leading-4 text-content-quaternary">{label}</p>
      <p
        className={cn(
          "text-sm leading-5 font-medium text-content-primary",
          isEmpty && "text-content-quaternary",
          className,
        )}
      >
        {isEmpty ? "—" : value}
      </p>
    </div>
  )
}

function AddressesCard({ addresses }: Readonly<{ addresses: CustomerAddress[] }>) {
  return (
    <Card variant="elevated" className="overflow-hidden rounded-[14px]">
      <div className="flex items-center gap-2 px-6 py-4">
        <MapPin className="size-4 text-content-tertiary" strokeWidth={1.75} aria-hidden />
        <h2 className="text-base leading-6 font-semibold text-content-primary">Addresses</h2>
      </div>
      <Table className="min-w-[720px] table-fixed">
        <TableHeader className="bg-surface-white">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-32 px-6">Type</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="w-40">City</TableHead>
            <TableHead className="w-44">Governorate</TableHead>
            <TableHead className="w-28 px-6 text-right">Country</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.length ? (
            addresses.map((address, index) => (
              <TableRow key={address.id ?? `${address.address_type}-${index}`}>
                <TableCell className="px-6 py-3">
                  <span className="flex items-center gap-2">
                    <span className="text-sm leading-5 text-content-secondary capitalize">
                      {address.address_type}
                    </span>
                    {address.is_default ? (
                      <Badge variant="neutral" className="rounded-full px-2 text-xs font-normal">
                        Default
                      </Badge>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className="py-3 font-medium text-content-primary">
                  {address.line}
                </TableCell>
                <TableCell className="py-3 text-content-secondary">{address.city}</TableCell>
                <TableCell className="py-3 text-content-secondary">
                  {address.governorate}
                </TableCell>
                <TableCell className="px-6 py-3 text-right text-content-secondary">
                  {address.country_code ?? "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="h-24 text-center text-content-tertiary">
                No addresses recorded for this customer.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

export function CustomerDetailView({
  customerId,
  canManage,
  onBack,
}: Readonly<{ customerId: string; canManage: boolean; onBack: () => void }>) {
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId)
  const [editOpen, setEditOpen] = React.useState(false)

  if (isLoading) return <SalesPageSpinner />
  if (isError || !customer) {
    return <SalesErrorState message="Failed to load customer." onRetry={() => void refetch()} />
  }

  const TypeIcon = customer.customer_type === "company" ? Building2 : UserRound
  const addresses = customer.addresses ?? []

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden />
          Back to customers
        </Button>
        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            className="ml-auto"
            onClick={() => setEditOpen(true)}
          >
            <Pencil aria-hidden />
            Edit
          </Button>
        ) : null}
      </div>

      <Card variant="elevated" className="rounded-[14px] p-6">
        <div className="flex flex-wrap items-start gap-3.5">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-base font-semibold text-brand-primary"
          >
            {customer.name.charAt(0).toUpperCase() || "C"}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg leading-7 font-semibold text-content-primary">
                {customer.name}
              </h1>
              <CustomerStatusBadge status={customer.status} label={customer.status_label} />
            </div>
            <span className="flex items-center gap-2 text-sm leading-5 text-content-secondary">
              <TypeIcon className="size-4" strokeWidth={1.75} aria-hidden />
              {customer.customer_type_label}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Assigned salesperson" value={customer.assigned_salesperson_name} />
          <DetailField label="Tax number" value={customer.tax_number} />
          <DetailField label="Source" value={customer.source} className="capitalize" />
          <DetailField label="Customer ID" value={customer.id} className="font-mono" />
        </div>
      </Card>

      <Card variant="elevated" className="rounded-[14px] p-6">
        <h2 className="text-base leading-6 font-semibold text-content-primary">Contact</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-content-tertiary" strokeWidth={1.75} aria-hidden />
            <DetailField
              label="Email"
              value={
                customer.email ? (
                  <a href={`mailto:${customer.email}`} className="break-all hover:underline">
                    {customer.email}
                  </a>
                ) : null
              }
            />
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-4 shrink-0 text-content-tertiary" strokeWidth={1.75} aria-hidden />
            <DetailField
              label="Phone"
              value={
                customer.phone ? (
                  <a href={`tel:${customer.phone.replace(/\s+/g, "")}`} className="hover:underline">
                    {customer.phone}
                  </a>
                ) : null
              }
            />
          </div>
        </div>
      </Card>

      <AddressesCard addresses={addresses} />

      <EditCustomerDialog
        customerId={editOpen ? customer.id : null}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
