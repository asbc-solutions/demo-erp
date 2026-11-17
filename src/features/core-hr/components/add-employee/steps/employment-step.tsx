"use client"

import { useTranslations } from "next-intl"

import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { useFieldError } from "../../../lib/hooks/use-field-error"
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
  const t = useTranslations("HrAddEmployee")
  const tShared = useTranslations("HrShared")
  const fieldError = useFieldError()
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
      title={t("employmentStepTitle")}
      description={t("employmentStepDescription")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="branch">{t("branch")}</FieldLabel>
          <Select
            value={value.branch}
            onValueChange={(next) => {
              update("branch")(next)
              update("department")("")
            }}
          >
            <SelectTrigger id="branch">
              <SelectValue placeholder={t("selectBranch")} />
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
            <RequiredLabel>{t("department")}</RequiredLabel>
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
                    ? t("selectDepartment")
                    : t("selectBranchFirst")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {branchDepartments.length === 0 ? (
                <div className="text-content-tertiary px-2 py-1.5 text-sm">
                  {t("noDepartmentsInBranch")}
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
            <FieldError id="department-error">{fieldError(errors.department)}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="position">{t("position")}</FieldLabel>
          <Select
            value={value.position ?? undefined}
            onValueChange={(next) => update("position")(next)}
          >
            <SelectTrigger id="position">
              <SelectValue placeholder={t("selectPosition")} />
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
          <FieldLabel htmlFor="grade">{t("grade")}</FieldLabel>
          <Select
            value={value.grade}
            onValueChange={(next) => update("grade")(next)}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder={t("selectGrade")} />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {t("gradeWithLevel", {
                    name: grade.grade_name,
                    level: grade.grade_level,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="hireDate">
            <RequiredLabel>{t("hireDate")}</RequiredLabel>
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
            <FieldError id="hireDate-error">{fieldError(errors.hireDate)}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="employmentType">
            <RequiredLabel>{t("employmentType")}</RequiredLabel>
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
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_TIME">
                {tShared("employmentType.full_time")}
              </SelectItem>
              <SelectItem value="PART_TIME">
                {tShared("employmentType.part_time")}
              </SelectItem>
              <SelectItem value="CONTRACT">
                {tShared("employmentType.contract")}
              </SelectItem>
              <SelectItem value="INTERN">{t("intern")}</SelectItem>
              <SelectItem value="TEMPORARY">
                {tShared("employmentType.temporary")}
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.employmentType && (
            <FieldError id="employmentType-error">
              {fieldError(errors.employmentType)}
            </FieldError>
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="reportsTo">{t("reportsTo")}</FieldLabel>
        <Input
          id="reportsTo"
          placeholder={t("managerNamePlaceholder")}
          value={value.reportsTo ?? ""}
          onChange={(event) => update("reportsTo")(event.target.value)}
        />
      </Field>
    </StepShell>
  )
}
