"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"

import type {
  Employee,
  EmploymentStatus,
  EmploymentType,
} from "../../../lib/types"
import { DetailField, SectionCard } from "../section-card"
import { useEmployeeEmploymentLabels } from "../use-employment-labels"

type EmploymentTabProps = Readonly<{
  employee: Employee
}>

const EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
]

const EMPLOYMENT_STATUSES: readonly EmploymentStatus[] = [
  "active",
  "inactive",
  "terminated",
  "resigned",
  "retired",
  "on_leave",
  "suspended",
]

const EMPTY_FIELD = "\u2014"

export function EmploymentTab({ employee }: EmploymentTabProps) {
  const t = useTranslations("HrEmployeeDetail")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const { employment } = employee
  const { branchName, departmentName, positionName, jobGradeName } =
    useEmployeeEmploymentLabels(employment)

  return (
    <SectionCard
      title={t("employmentTitle")}
      description={t("employmentDescription")}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        <DetailField label={t("branch")} value={branchName ?? EMPTY_FIELD} />
        <DetailField label={t("department")} value={departmentName ?? EMPTY_FIELD} />
        <DetailField label={t("position")} value={positionName ?? EMPTY_FIELD} />
        <DetailField label={t("jobGrade")} value={jobGradeName ?? EMPTY_FIELD} />
        <DetailField label={t("hireDate")} value={employment.hire_date} />
        <DetailField
          label={t("employmentType")}
          value={
            <Badge
              variant="outline"
              className="border-stroke-default bg-surface-hover text-content-secondary rounded-md px-2 py-0.5 text-[11px] tracking-[0.4px] uppercase"
            >
              {EMPLOYMENT_TYPES.includes(employment.employment_type)
                ? tShared(`employmentType.${employment.employment_type}`)
                : employment.employment_type}
            </Badge>
          }
        />
        <DetailField
          label={tCommon("status")}
          value={
            EMPLOYMENT_STATUSES.includes(employment.employment_status)
              ? tShared(`employmentStatus.${employment.employment_status}`)
              : employment.employment_status
          }
        />
        {employment.manager_id && (
          <DetailField label={t("reportsTo")} value={employment.manager_id} />
        )}
      </div>
    </SectionCard>
  )
}
