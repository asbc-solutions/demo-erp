import { Building2, UserRound } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import type { CustomerListItem } from "../../lib/types"
import { CustomerActions } from "./customer-actions"
import { CustomerStatusBadge } from "./customer-status-badge"

export function CustomersTable({
  customers,
  canManage,
  onSelectCustomer,
  onEdit,
  onBlock,
  onUnblock,
}: Readonly<{
  customers: CustomerListItem[]
  canManage: boolean
  onSelectCustomer: (customerId: string) => void
  onEdit: (customer: CustomerListItem) => void
  onBlock: (customer: CustomerListItem) => void
  onUnblock: (customer: CustomerListItem) => void
}>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-7xl table-fixed">
        <TableHeader className="bg-surface-white">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-90 px-5">Customer Name</TableHead>
            <TableHead className="w-35">Type</TableHead>
            <TableHead className="w-45">Phone</TableHead>
            <TableHead className="w-62.5">Email</TableHead>
            <TableHead className="w-47.5">Salesperson</TableHead>
            <TableHead className="w-30">Status</TableHead>
            <TableHead className="w-18 px-5 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length ? (
            customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="h-17.5 cursor-pointer"
                onClick={() => onSelectCustomer(customer.id)}
              >
                <TableCell className="px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-brand-primary">
                      {customer.name.charAt(0).toUpperCase() || "C"}
                    </span>
                    <span className="truncate font-semibold text-content-primary">
                      {customer.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className="flex items-center gap-2 text-content-secondary">
                    {customer.customer_type === "company" ? (
                      <Building2 className="size-4" strokeWidth={1.75} aria-hidden />
                    ) : (
                      <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
                    )}
                    {customer.customer_type_label}
                  </span>
                </TableCell>
                <TableCell className="py-3">{customer.phone}</TableCell>
                <TableCell className="py-3">{customer.email}</TableCell>
                <TableCell className="truncate py-3 text-xs text-content-secondary">
                  {customer.assigned_salesperson_name}
                </TableCell>
                <TableCell className="py-3">
                  <CustomerStatusBadge status={customer.status} label={customer.status_label} />
                </TableCell>
                <TableCell
                  className="px-5 py-3 text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  <CustomerActions
                    customer={customer}
                    canManage={canManage}
                    onView={() => onSelectCustomer(customer.id)}
                    onEdit={() => onEdit(customer)}
                    onBlock={() => onBlock(customer)}
                    onUnblock={() => onUnblock(customer)}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-content-tertiary">
                No customers match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
