"use client"

import { useBranch } from "../../lib/queries/branches"
import { useDepartment } from "../../lib/queries/departments"
import { useJobGrade } from "../../lib/queries/job-grades"
import { usePosition } from "../../lib/queries/positions"
import type { Employee } from "../../lib/types"

type EmploymentLabelOptions = Readonly<{
  branch?: boolean
  department?: boolean
  position?: boolean
  jobGrade?: boolean
}>

export function useEmployeeEmploymentLabels(
  employment: Employee["employment"],
  options: EmploymentLabelOptions = {},
) {
  const branchId = options.branch === false ? "" : (employment.branch_id ?? "")
  const departmentId =
    options.department === false ? "" : (employment.dept_id ?? "")
  const positionId =
    options.position === false ? "" : (employment.position_id ?? "")
  const jobGradeId =
    options.jobGrade === false ? "" : (employment.job_grade_id ?? "")

  const { data: branch } = useBranch(branchId)
  const { data: department } = useDepartment(departmentId)
  const { data: position } = usePosition(positionId)
  const { data: jobGrade } = useJobGrade(jobGradeId)

  return {
    branchName: branch?.branch_name ?? null,
    departmentName: department?.dept_name ?? null,
    positionName: position?.position_title ?? null,
    jobGradeName: jobGrade
      ? `${jobGrade.grade_name} (Level ${jobGrade.grade_level})`
      : null,
  }
}
