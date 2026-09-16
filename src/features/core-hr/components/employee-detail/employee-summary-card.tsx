"use client"

import { Building2, CalendarDays, Star } from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"

import type { Employee } from "../../lib/types"
import { useEmployeeEmploymentLabels } from "./use-employment-labels"

type EmployeeSummaryCardProps = Readonly<{
  employee: Employee
}>

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "border-brand-success/30 bg-brand-success/10 text-brand-success",
  },
  on_leave: {
    label: "On Leave",
    className:
      "border-brand-warning/30 bg-brand-warning/10 text-brand-warning",
  },
  terminated: {
    label: "Terminated",
    className: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
  },
  resigned: {
    label: "Resigned",
    className: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
  },
  retired: {
    label: "Retired",
    className: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
  },
  inactive: {
    label: "Inactive",
    className:
      "border-stroke-default bg-surface-hover text-content-tertiary",
  },
  suspended: {
    label: "Suspended",
    className:
      "border-stroke-default bg-surface-hover text-content-tertiary",
  },
}

export function EmployeeSummaryCard({ employee }: EmployeeSummaryCardProps) {
  const badge =
    STATUS_BADGE[employee.employment.employment_status] ?? STATUS_BADGE.inactive
  const { departmentName, positionName } = useEmployeeEmploymentLabels(
    employee.employment,
    { branch: false, jobGrade: false },
  )

  return (
    <div className="border-stroke-default relative overflow-hidden rounded-[14px] border shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="bg-linear-to-r from-brand-primary/8 via-brand-primary/4 to-transparent flex items-center gap-6 px-6 py-6">
        <Avatar
          alt={employee.full_name}
          fallback={employee.avatar_initials}
          className="size-20 text-2xl"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-content-primary text-xl leading-7 font-semibold">
              {employee.full_name}
            </h1>
            <Badge
              variant="outline"
              className={`rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase ${badge.className}`}
            >
              {badge.label}
            </Badge>
          </div>
          <p className="text-content-tertiary text-sm leading-5">
            {employee.employee_number}
          </p>
          <div className="text-content-tertiary flex flex-wrap items-center gap-x-6 gap-y-1 text-sm leading-5">
            {departmentName && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" strokeWidth={1.75} />
                {departmentName}
              </span>
            )}
            {positionName && (
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-3.5" strokeWidth={1.75} />
                {positionName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" strokeWidth={1.75} />
              Joined {employee.employment.hire_date}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
