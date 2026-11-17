"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { ApiError } from "@/src/shared/lib/types/api"
import { useCreateEmployee, useUpdateEmployee } from "../lib/mutations/employees"
import { useCreateSalary } from "../lib/mutations/salaries"
import { useEmployee, useEmployees } from "../lib/queries/employees"
import { useActiveDepartmentOptions } from "../lib/queries/org-selectors"
import type {
  CreateEmployeePayload,
  Employee,
  EmployeeListItem,
  EmploymentType as ApiEmploymentType,
  Gender as ApiGender,
} from "../lib/types"
import type {
  EmploymentType as MockEmploymentType,
  Gender as MockGender,
  NewEmployeeDraft,
} from "../types/employee"
import { useEmployeeView } from "../hooks/use-employee-view"
import { HrPageSpinner } from "./shared/hr-loading"
import { HrTablePagination } from "./shared/hr-table-pagination"
import { AddEmployeeFlow } from "./add-employee/add-employee-flow"
import {
  EmployeeDetailView,
  type EmployeeDetailTabId,
} from "./employee-detail/employee-detail-view"
import { HrActionBar } from "./hr-action-bar"
import type {
  HrFilterGroup,
  HrFilterValues,
} from "./shared/hr-filter-panel"
import { HrEmployeeTable } from "./hr-employee-table"
import { HrStatsOverview } from "./hr-stats-overview"
import { ExportEmployeesDialog } from "./employee-operations/export-employees-dialog"
import { PromoteEmployeeDialog } from "./employee-operations/promote-employee-dialog"
import { TerminateEmployeeDialog } from "./employee-operations/terminate-employee-dialog"
import { TransferEmployeeDialog } from "./employee-operations/transfer-employee-dialog"

const EMPLOYMENT_TYPE_MAP: Record<MockEmploymentType, ApiEmploymentType> = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract",
  INTERN: "internship",
  TEMPORARY: "temporary",
}

// Reverse maps for prefilling the edit form from an API employee record.
const EMPLOYMENT_TYPE_TO_DRAFT: Record<ApiEmploymentType, MockEmploymentType> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACT",
  internship: "INTERN",
  temporary: "TEMPORARY",
}

const GENDER_TO_DRAFT: Record<ApiGender, MockGender> = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
}

const PAGE_SIZE = 10

// Status options for the Filters popover — mapped to the `employment_status`
// field on each list row so filtering happens client-side against the fetched
// page (matching the HR Core "Filters" design).
const EMPLOYEE_STATUS_OPTIONS = [
  "active",
  "on_leave",
  "suspended",
  "inactive",
  "terminated",
] as const

type EmployeesTranslator = ReturnType<typeof useTranslations<"HrEmployees">>

function toCreatePayload(draft: NewEmployeeDraft): CreateEmployeePayload {
  return {
    first_name: draft.personal.firstName ?? "",
    last_name: draft.personal.lastName ?? "",
    email_work: draft.personal.email ?? "",
    hire_date:
      draft.employment.hireDate || new Date().toISOString().slice(0, 10),
    employment_type: draft.employment.employmentType
      ? EMPLOYMENT_TYPE_MAP[draft.employment.employmentType]
      : "full_time",
    phone_mobile: draft.personal.phone || null,
    gender: draft.personal.gender
      ? (draft.personal.gender.toLowerCase() as ApiGender)
      : null,
    nationality: draft.personal.nationality || null,
    national_id: draft.personal.nationalId || null,
    date_of_birth: draft.personal.dateOfBirth || null,
    city: draft.personal.city || null,
    country: draft.personal.country || null,
    branch_id: draft.employment.branch || null,
    dept_id: draft.employment.department || null,
    position_id: draft.employment.position || null,
    job_grade_id: draft.employment.grade || null,
  }
}

function toInitialSalaryPayload(draft: NewEmployeeDraft) {
  const annualGross = draft.compensation.grossAnnual
  if (!annualGross) return null

  return {
    // The onboarding form captures an annual amount, while the Salary API and
    // the compensation cards use monthly amounts.
    basic_salary: Math.round((annualGross / 12) * 100) / 100,
    currency_code: "EGP",
    pay_frequency: "monthly",
    effective_date:
      draft.employment.hireDate || new Date().toISOString().slice(0, 10),
    ...(draft.employment.grade
      ? { job_grade_id: draft.employment.grade }
      : {}),
  }
}

// Reverse of toCreatePayload: hydrate the stepper draft from an API record so
// the edit form opens pre-filled with the employee's current data.
function toEditDraft(employee: Employee): NewEmployeeDraft {
  const { personal_info, contact, address, employment } = employee
  return {
    personal: {
      firstName: personal_info.first_name,
      lastName: personal_info.last_name,
      email: contact.email_work,
      phone: contact.phone_mobile ?? "",
      dateOfBirth: personal_info.date_of_birth ?? "",
      gender: personal_info.gender
        ? GENDER_TO_DRAFT[personal_info.gender]
        : undefined,
      nationality: personal_info.nationality ?? "",
      nationalId: personal_info.national_id ?? "",
      city: address.city ?? "",
      country: address.country ?? "",
    },
    employment: {
      branch: employment.branch_id ?? undefined,
      department: employment.dept_id ?? undefined,
      position: employment.position_id ?? null,
      grade: employment.job_grade_id ?? undefined,
      hireDate: employment.hire_date,
      employmentType: EMPLOYMENT_TYPE_TO_DRAFT[employment.employment_type],
    },
    compensation: {},
  }
}

function toastMutationError(
  err: unknown,
  fallbackTitle: string,
  t: EmployeesTranslator,
) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    const description = Object.entries(fields)
      .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
      .join(" · ")
    toast.error(t("validationFailed"), { description })
  } else {
    toast.error(fallbackTitle, {
      description: apiErr.message ?? t("checkDetailsAndRetry"),
    })
  }
}

function EmployeeDetailLoader({
  employeeId,
  onBack,
  initialTab,
}: {
  employeeId: string
  onBack: () => void
  initialTab: EmployeeDetailTabId
}) {
  const t = useTranslations("HrEmployees")
  const { data: employee, isLoading, isError } = useEmployee(employeeId)

  if (isLoading) return <HrPageSpinner />

  if (isError || !employee) {
    return (
      <div className="text-content-tertiary py-12 text-center text-sm">
        {t("loadFailed")}{" "}
        <button
          type="button"
          onClick={onBack}
          className="text-brand-primary ms-1 underline"
        >
          {t("backToList")}
        </button>
      </div>
    )
  }

  return (
    <EmployeeDetailView
      employee={employee}
      onBack={onBack}
      initialTab={initialTab}
    />
  )
}

function EmployeeEditLoader({
  employeeId,
  onBack,
}: {
  employeeId: string
  onBack: () => void
}) {
  const { data: employee, isLoading, isError } = useEmployee(employeeId)
  const t = useTranslations("HrEmployees")
  const updateEmployee = useUpdateEmployee()

  if (isLoading) return <HrPageSpinner />

  if (isError || !employee) {
    return (
      <div className="text-content-tertiary py-12 text-center text-sm">
        {t("loadFailed")}{" "}
        <button
          type="button"
          onClick={onBack}
          className="text-brand-primary ms-1 underline"
        >
          {t("backToList")}
        </button>
      </div>
    )
  }

  return (
    <AddEmployeeFlow
      mode="edit"
      initialDraft={toEditDraft(employee)}
      submitting={updateEmployee.isPending}
      onCancel={onBack}
      onSubmit={(draft: NewEmployeeDraft) => {
        updateEmployee.mutate(
          { id: employee.id, payload: toCreatePayload(draft) },
          {
            onSuccess: (updated) => {
              toast.success(t("updatedToast", { name: updated.full_name }), {
                description: t("updatedToastDescription"),
              })
              onBack()
            },
            onError: (err) =>
              toastMutationError(err, t("updateFailed"), t),
          },
        )
      }}
    />
  )
}

export function EmployeesModule() {
  const t = useTranslations("HrEmployees")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const { view, showList, showAdd, showEdit, showDetail } = useEmployeeView()
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [page, setPage] = useState(1)
  const [initialDetailTab, setInitialDetailTab] =
    useState<EmployeeDetailTabId>("personal")
  const [promoteEmployee, setPromoteEmployee] =
    useState<EmployeeListItem | null>(null)
  const [transferEmployee, setTransferEmployee] =
    useState<EmployeeListItem | null>(null)
  const [terminateEmployee, setTerminateEmployee] =
    useState<EmployeeListItem | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const viewProfile = (employeeId: string) => {
    setPromoteEmployee(null)
    setTransferEmployee(null)
    setTerminateEmployee(null)
    setInitialDetailTab("personal")
    showDetail(employeeId)
  }

  // The `search` API param only reliably matches a single term against one
  // field at a time (e.g. first name OR employee number) — a multi-word query
  // like "3bwahab Ahmed" (first + last name together) returns nothing server
  // side. Send just the first word, which we know matches, then narrow the
  // result client-side by requiring every remaining word to also appear.
  const searchTerms = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const { data, isLoading } = useEmployees({
    per_page: 200,
    ...(searchTerms.length > 0 ? { search: searchTerms[0] } : {}),
  })
  const meta = data?.meta

  const { data: departmentsData } = useActiveDepartmentOptions()

  const filterGroups: HrFilterGroup[] = [
    {
      id: "status",
      label: tCommon("status"),
      options: EMPLOYEE_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: tShared(`employmentStatus.${status}`),
      })),
    },
    {
      id: "department",
      label: t("filterDepartment"),
      options: (departmentsData?.data ?? []).map((dept) => ({
        value: dept.id,
        label: dept.dept_name,
      })),
    },
  ]

  const statusFilter = filters.status ?? []
  const deptFilter = filters.department ?? []

  // Newest employees first — employee numbers are assigned sequentially, so the
  // most recently created record sorts to the top of the list.
  const employees = [...(data?.data ?? [])]
    .filter((employee) => {
      if (searchTerms.length <= 1) return true
      const haystack =
        `${employee.full_name} ${employee.employee_number}`.toLowerCase()
      return searchTerms.every((term) => haystack.includes(term))
    })
    .filter(
      (employee) =>
        statusFilter.length === 0 ||
        statusFilter.includes(employee.employment_status),
    )
    .filter(
      (employee) =>
        deptFilter.length === 0 ||
        (employee.dept_id !== null && deptFilter.includes(employee.dept_id)),
    )
    .sort((a, b) =>
      b.employee_number.localeCompare(a.employee_number, undefined, {
        numeric: true,
      }),
    )

  const pageCount = Math.max(1, Math.ceil(employees.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageEmployees = employees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const createEmployee = useCreateEmployee()
  const createSalary = useCreateSalary()

  if (view.mode === "add") {
    return (
      <AddEmployeeFlow
        onCancel={showList}
        submitting={createEmployee.isPending || createSalary.isPending}
        onSubmit={(draft: NewEmployeeDraft) => {
          const payload = toCreatePayload(draft)
          const salaryPayload = toInitialSalaryPayload(draft)
          createEmployee.mutate(payload, {
            onSuccess: (employee) => {
              if (!salaryPayload) {
                toast.success(t("addedToast", { name: employee.full_name }))
                setPage(1)
                showList()
                return
              }

              createSalary.mutate(
                { employeeId: employee.id, payload: salaryPayload },
                {
                  onSuccess: () => {
                    toast.success(t("addedToast", { name: employee.full_name }), {
                      description: t("addedWithCompensationDescription"),
                    })
                    setPage(1)
                    showList()
                  },
                  onError: (err) => {
                    toastMutationError(
                      err,
                      t("compensationFailed", { name: employee.full_name }),
                      t,
                    )
                    // The employee already exists, so leave the add flow to
                    // prevent a retry from creating a duplicate employee.
                    setPage(1)
                    showList()
                  },
                }
              )
            },
            onError: (err) =>
              toastMutationError(err, t("createFailed"), t),
          })
        }}
      />
    )
  }

  if (view.mode === "edit") {
    return <EmployeeEditLoader employeeId={view.employeeId} onBack={showList} />
  }

  if (view.mode === "detail") {
    return (
      <EmployeeDetailLoader
        employeeId={view.employeeId}
        onBack={showList}
        initialTab={initialDetailTab}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <HrStatsOverview
        totalHeadcount={meta?.total_headcount}
        openPositions={meta?.open_positions}
        avgTenureYears={meta?.avg_tenure_years}
        departmentCount={meta?.department_count}
        isLoading={isLoading}
      />

      <div className="flex flex-col gap-4">
        <HrActionBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          onAddEmployee={showAdd}
          onExport={() => setExportOpen(true)}
          filterGroups={filterGroups}
          filterValues={filters}
          onFilterChange={(next) => {
            setFilters(next)
            setPage(1)
          }}
        />
        <HrEmployeeTable
          employees={pageEmployees}
          isLoading={isLoading}
          onViewProfile={(employee) => {
            setInitialDetailTab("personal")
            showDetail(employee.id)
          }}
          onEditDetails={(employee) => showEdit(employee.id)}
          onPromote={(employee) => setPromoteEmployee(employee)}
          onTransfer={(employee) => {
            setTransferEmployee(employee)
          }}
          onTerminate={(employee) => setTerminateEmployee(employee)}
        />
        {!isLoading && (
          <HrTablePagination
            page={currentPage}
            pageCount={pageCount}
            total={employees.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      <PromoteEmployeeDialog
        employee={promoteEmployee}
        open={Boolean(promoteEmployee)}
        onOpenChange={(open) => {
          if (!open) setPromoteEmployee(null)
        }}
        onViewProfile={viewProfile}
      />

      <TransferEmployeeDialog
        employee={transferEmployee}
        open={Boolean(transferEmployee)}
        onOpenChange={(open) => {
          if (!open) setTransferEmployee(null)
        }}
        onViewProfile={viewProfile}
      />

      <TerminateEmployeeDialog
        employee={terminateEmployee}
        open={Boolean(terminateEmployee)}
        onOpenChange={(open) => {
          if (!open) setTerminateEmployee(null)
        }}
        onViewProfile={viewProfile}
      />

      <ExportEmployeesDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        employees={employees}
      />
    </div>
  )
}
