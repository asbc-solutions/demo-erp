"use client"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import type { EmployeeListItem, EmploymentStatus } from "../lib/types"
import { HrTableSkeleton } from "./shared/hr-loading"
import { EmployeeRowActions } from "./hr-employee-row-actions"

type HrEmployeeTableProps = Readonly<{
  employees?: EmployeeListItem[]
  isLoading?: boolean
  onViewProfile?: (employee: EmployeeListItem) => void
  onEditDetails?: (employee: EmployeeListItem) => void
  onPromote?: (employee: EmployeeListItem) => void
  onTransfer?: (employee: EmployeeListItem) => void
  onTerminate?: (employee: EmployeeListItem) => void
}>

function StatusBadge({ status }: Readonly<{ status: EmploymentStatus }>) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="border-brand-success/30 bg-brand-success/10 text-brand-success rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
      >
        Active
      </Badge>
    )
  }

  if (status === "on_leave") {
    return (
      <Badge
        variant="outline"
        className="border-brand-warning/30 bg-brand-warning/10 text-brand-warning rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
      >
        On Leave
      </Badge>
    )
  }

  if (status === "terminated" || status === "resigned" || status === "retired") {
    return (
      <Badge
        variant="outline"
        className="border-brand-danger/30 bg-brand-danger/10 text-brand-danger rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
      >
        {status === "resigned"
          ? "Resigned"
          : status === "retired"
            ? "Retired"
            : "Terminated"}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-stroke-default bg-surface-hover text-content-tertiary rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
    >
      Inactive
    </Badge>
  )
}

export function HrEmployeeTable({
  employees = [],
  isLoading = false,
  onViewProfile,
  onEditDetails,
  onPromote,
  onTransfer,
  onTerminate,
}: HrEmployeeTableProps) {
  return (
    <div className="border-stroke-default bg-surface-white overflow-hidden rounded-[12px] border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="ps-6">Employee</TableHead>
            <TableHead>Employee #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead className="pe-6 text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <HrTableSkeleton rows={5} />
        ) : (
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-12 text-center text-sm"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}
            {employees.map((employee) => (
              <TableRow
                key={employee.id}
                role="button"
                tabIndex={0}
                aria-label={`View ${employee.full_name}`}
                onClick={() => onViewProfile?.(employee)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onViewProfile?.(employee)
                  }
                }}
                className="hover:bg-surface-hover focus-visible:ring-brand-primary/30 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset"
              >
                <TableCell className="ps-6">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      alt={employee.full_name}
                      fallback={employee.avatar_initials}
                    />
                    <span className="text-content-primary text-sm font-medium">
                      {employee.full_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-content-tertiary font-mono">
                  {employee.employee_number}
                </TableCell>
                <TableCell className="text-content-secondary capitalize">
                  {employee.employment_type?.replace("_", " ")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={employee.employment_status} />
                </TableCell>
                <TableCell className="text-content-tertiary">
                  {employee.hire_date}
                </TableCell>
                <TableCell
                  className="pe-6 text-end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <EmployeeRowActions
                    employeeName={employee.full_name}
                    onViewProfile={() => onViewProfile?.(employee)}
                    onEditDetails={() => onEditDetails?.(employee)}
                    onPromote={() => onPromote?.(employee)}
                    onTransfer={() => onTransfer?.(employee)}
                    onTerminate={() => onTerminate?.(employee)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  )
}
