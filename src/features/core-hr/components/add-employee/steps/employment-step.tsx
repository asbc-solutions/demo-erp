"use client"

import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { useJobGrades } from "../../../lib/queries/job-grades"
import {
  useActiveBranchOptions,
  useActiveDepartmentOptions,
} from "../../../lib/queries/org-selectors"
import { usePositions } from "../../../lib/queries/positions"
import type { EmploymentType, NewEmployeeDraft } from "../../../types/employee"
import { StepShell } from "../step-shell"

export type EmploymentField =
  | "branch"
  | "department"
  | "position"
  | "grade"
  | "hireDate"
  | "employmentType"
  | "reportsTo"

export type EmploymentErrors = Partial<Record<EmploymentField, string>>

type EmploymentStepProps = Readonly<{
  value: NewEmployeeDraft["employment"]
  onChange: (next: NewEmployeeDraft["employment"]) => void
  errors?: EmploymentErrors
}>

function RequiredLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span>
      {children} <span className="text-brand-danger">*</span>
    </span>
  )
}

export function EmploymentStep({
  value,
  onChange,
  errors = {},
}: EmploymentStepProps) {
  const update =
    <K extends keyof NewEmployeeDraft["employment"]>(key: K) =>
    (next: NewEmployeeDraft["employment"][K]) =>
      onChange({ ...value, [key]: next })

  const { data: branchesData } = useActiveBranchOptions()
  const { data: departmentsData } = useActiveDepartmentOptions()
  const { data: positionsData } = usePositions({
    per_page: 100,
    is_active: true,
  })
  const { data: gradesData } = useJobGrades({ per_page: 100, is_active: true })

  const branches = branchesData?.data ?? []
  const departments = departmentsData?.data ?? []
  const positions = positionsData?.data ?? []
  const grades = gradesData?.data ?? []

  const branchDepartments = departments.filter(
    (department) => !value.branch || department.branch_id === value.branch
  )

  return (
    <StepShell
      title="Step 2: Employment"
      description="Assign department, position, and employment details"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="branch">Branch</FieldLabel>
          <Select
            value={value.branch}
            onValueChange={(next) => {
              update("branch")(next)
              update("department")("")
            }}
          >
            <SelectTrigger id="branch">
              <SelectValue placeholder="Select branch..." />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="department">
            <RequiredLabel>Department</RequiredLabel>
          </FieldLabel>
          <Select
            value={value.department}
            onValueChange={(next) => update("department")(next)}
            // disabled={!value.branch}
          >
            <SelectTrigger
              id="department"
              aria-invalid={Boolean(errors.department)}
              aria-describedby={
                errors.department ? "department-error" : undefined
              }
            >
              <SelectValue
                placeholder={
                  value.branch
                    ? "Select department..."
                    : "Select branch first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {branchDepartments.length === 0 ? (
                <div className="text-content-tertiary px-2 py-1.5 text-sm">
                  No departments available in this branch.
                </div>
              ) : (
                branchDepartments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.dept_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.department && (
            <FieldError id="department-error">{errors.department}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="position">Position</FieldLabel>
          <Select
            value={value.position ?? undefined}
            onValueChange={(next) => update("position")(next)}
          >
            <SelectTrigger id="position">
              <SelectValue placeholder="Select position..." />
            </SelectTrigger>
            <SelectContent>
              {positions.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.position_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="grade">Grade</FieldLabel>
          <Select
            value={value.grade}
            onValueChange={(next) => update("grade")(next)}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade..." />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.grade_name} (Level {grade.grade_level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="hireDate">
            <RequiredLabel>Hire Date</RequiredLabel>
          </FieldLabel>
          <Input
            id="hireDate"
            type="date"
            aria-invalid={Boolean(errors.hireDate)}
            aria-describedby={errors.hireDate ? "hireDate-error" : undefined}
            value={value.hireDate ?? ""}
            onChange={(event) => update("hireDate")(event.target.value)}
          />
          {errors.hireDate && (
            <FieldError id="hireDate-error">{errors.hireDate}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="employmentType">
            <RequiredLabel>Employment Type</RequiredLabel>
          </FieldLabel>
          <Select
            value={value.employmentType}
            onValueChange={(next) =>
              update("employmentType")(next as EmploymentType)
            }
          >
            <SelectTrigger
              id="employmentType"
              aria-invalid={Boolean(errors.employmentType)}
              aria-describedby={
                errors.employmentType ? "employmentType-error" : undefined
              }
            >
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_TIME">Full time</SelectItem>
              <SelectItem value="PART_TIME">Part time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
              <SelectItem value="TEMPORARY">Temporary</SelectItem>
            </SelectContent>
          </Select>
          {errors.employmentType && (
            <FieldError id="employmentType-error">
              {errors.employmentType}
            </FieldError>
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="reportsTo">Reports To</FieldLabel>
        <Input
          id="reportsTo"
          placeholder="Manager name"
          value={value.reportsTo ?? ""}
          onChange={(event) => update("reportsTo")(event.target.value)}
        />
      </Field>
    </StepShell>
  )
}
