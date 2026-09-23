"use client"

import { useMemo } from "react"

import { useEmployees } from "@/src/features/core-hr/lib/queries/employees"
import { useActiveDepartmentOptions } from "@/src/features/core-hr/lib/queries/org-selectors"

/**
 * `GET /pm/resources` is the HR employee record left-joined with the PM
 * profile, and the join drops the org placement — there is no department on
 * `ResourcePoolItem`. The planner's Department filter therefore resolves it the
 * way the HR module does: employee → `dept_id` → department name.
 */
export function useResourceDepartments(): Map<string, string> {
  const employeesQuery = useEmployees({ per_page: 200 })
  const departmentsQuery = useActiveDepartmentOptions()

  const employees = employeesQuery.data?.data
  const departments = departmentsQuery.data?.data

  return useMemo(() => {
    const nameByDeptId = new Map(
      (departments ?? []).map((dept) => [dept.id, dept.dept_name]),
    )
    const departmentByEmployee = new Map<string, string>()
    for (const employee of employees ?? []) {
      const name = employee.dept_id
        ? nameByDeptId.get(employee.dept_id)
        : undefined
      if (name) departmentByEmployee.set(employee.id, name)
    }
    return departmentByEmployee
  }, [employees, departments])
}
