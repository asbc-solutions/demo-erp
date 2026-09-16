"use client"

import { Badge } from "@/src/shared/components/ui/badge"

import type { Employee, EmploymentType } from "../../../lib/types"
import { DetailField, SectionCard } from "../section-card"
import { useEmployeeEmploymentLabels } from "../use-employment-labels"

type EmploymentTabProps = Readonly<{
  employee: Employee
}>

const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  terminated: "Terminated",
  resigned: "Resigned",
  retired: "Retired",
  on_leave: "On Leave",
  suspended: "Suspended",
}

const EMPTY_FIELD = "\u2014"

export function EmploymentTab({ employee }: EmploymentTabProps) {
  const { employment } = employee
  const { branchName, departmentName, positionName, jobGradeName } =
    useEmployeeEmploymentLabels(employment)

  return (
    <SectionCard
      title="Employment Details"
      description="Organization and role information"
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        <DetailField label="Branch" value={branchName ?? EMPTY_FIELD} />
        <DetailField label="Department" value={departmentName ?? EMPTY_FIELD} />
        <DetailField label="Position" value={positionName ?? EMPTY_FIELD} />
        <DetailField label="Job Grade" value={jobGradeName ?? EMPTY_FIELD} />
        <DetailField label="Hire Date" value={employment.hire_date} />
        <DetailField
          label="Employment Type"
          value={
            <Badge
              variant="outline"
              className="border-stroke-default bg-surface-hover text-content-secondary rounded-md px-2 py-0.5 text-[11px] tracking-[0.4px] uppercase"
            >
              {EMPLOYMENT_TYPE_LABEL[employment.employment_type] ??
                employment.employment_type}
            </Badge>
          }
        />
        <DetailField
          label="Status"
          value={
            STATUS_LABEL[employment.employment_status] ??
            employment.employment_status
          }
        />
        {employment.manager_id && (
          <DetailField label="Reports To" value={employment.manager_id} />
        )}
      </div>
    </SectionCard>
  )
}
