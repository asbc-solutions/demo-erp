"use client"

import { useState } from "react"
import { DollarSign, Plus, TrendingUp } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { useSalaryAnalytics } from "../../lib/queries/salaries"
import { useEmployees } from "../../lib/queries/employees"
import type { SalaryAnalyticsDept, EmployeeListItem } from "../../lib/types"
import type { HrFilterGroup, HrFilterValues } from "../shared/hr-filter-panel"
import { HrToolbar } from "../shared/hr-toolbar"
import { SalaryChangeDialog } from "./salary-change-dialog"

const EMPTY_EMPLOYEES: EmployeeListItem[] = []

const DEPT_COLORS = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "violet",
  "blue",
] as const
type DeptColor = (typeof DEPT_COLORS)[number]

const BAR_COLOR_CLASS: Record<DeptColor, string> = {
  indigo: "bg-brand-primary",
  emerald: "bg-brand-success",
  amber: "bg-brand-warning",
  rose: "bg-brand-danger",
  violet: "bg-violet-500",
  blue: "bg-brand-info",
}

const DOT_COLOR_CLASS: Record<DeptColor, string> = {
  indigo: "bg-brand-primary",
  emerald: "bg-brand-success",
  amber: "bg-brand-warning",
  rose: "bg-brand-danger",
  violet: "bg-violet-500",
  blue: "bg-brand-info",
}

function deptColor(index: number): DeptColor {
  return DEPT_COLORS[index % DEPT_COLORS.length]
}

const formatEGP = (value: number) =>
  value >= 1_000_000
    ? `EGP ${(value / 1_000_000).toFixed(1)}M`
    : `EGP ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`

const formatEGPK = (value: number) =>
  `EGP ${Math.round(value / 1000).toLocaleString("en-US")}K`

type StatPanelProps = Readonly<{
  label: string
  value: React.ReactNode
  trend?: React.ReactNode
  description?: React.ReactNode
  icon: React.ReactNode
  tone?: "indigo" | "emerald"
}>

function StatPanel({
  label,
  value,
  trend,
  description,
  icon,
  tone = "indigo",
}: StatPanelProps) {
  return (
    <div className="border-stroke-default bg-surface-white flex items-start justify-between gap-4 rounded-[14px] border px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <span className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
          {label}
        </span>
        <span className="text-content-primary text-2xl leading-8 font-semibold">
          {value}
        </span>
        {trend && (
          <span className="text-brand-success text-xs font-medium">{trend}</span>
        )}
        {description && (
          <span className="text-content-tertiary text-xs leading-4">
            {description}
          </span>
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
          tone === "indigo" && "bg-brand-primary/10 text-brand-primary",
          tone === "emerald" && "bg-brand-success/10 text-brand-success"
        )}
      >
        {icon}
      </span>
    </div>
  )
}

function StatPanelSkeleton() {
  return (
    <div className="border-stroke-default bg-surface-white flex flex-col gap-2 rounded-[14px] border px-5 py-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

function SalaryCostByDepartment({
  rows,
}: Readonly<{ rows: SalaryAnalyticsDept[] }>) {
  const max = Math.max(...rows.map((r) => r.total_cost), 1)
  return (
    <section className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-5">
      <h3 className="text-content-primary text-base leading-6 font-semibold">
        Salary Cost by Department
      </h3>
      <ul className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const percent = (row.total_cost / max) * 100
          const color = deptColor(i)
          return (
            <li key={row.dept_name} className="flex items-center gap-3">
              <span className="text-content-tertiary w-[88px] shrink-0 truncate text-xs">
                {row.dept_name}
              </span>
              <span className="bg-stroke-light relative h-3 flex-1 overflow-hidden rounded-full">
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    BAR_COLOR_CLASS[color]
                  )}
                  style={{ width: `${percent}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function DepartmentBreakdown({
  rows,
}: Readonly<{ rows: SalaryAnalyticsDept[] }>) {
  return (
    <section className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-5">
      <h3 className="text-content-primary text-base leading-6 font-semibold">
        Department Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-content-tertiary text-xs">
              <th className="py-2 text-left font-medium">Department</th>
              <th className="py-2 text-right font-medium">Headcount</th>
              <th className="py-2 text-right font-medium">Total Cost</th>
              <th className="py-2 text-right font-medium">Avg Salary</th>
              <th className="py-2 text-right font-medium">% of Total</th>
            </tr>
          </thead>
          <tbody className="text-content-secondary">
            {rows.map((row, i) => (
              <tr
                key={row.dept_name}
                className="border-stroke-light border-t [&_td]:py-2"
              >
                <td>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 rounded-full",
                        DOT_COLOR_CLASS[deptColor(i)]
                      )}
                    />
                    {row.dept_name}
                  </span>
                </td>
                <td className="text-right">{row.headcount}</td>
                <td className="text-right">{formatEGPK(row.total_cost)}</td>
                <td className="text-right">
                  EGP{" "}
                  {row.avg_salary.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="text-content-primary text-right font-semibold">
                  {row.pct_of_total.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function SalariesTab() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)

  const { data: analytics, isLoading } = useSalaryAnalytics()
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    per_page: 200,
  })

  const employees = employeesData?.data ?? EMPTY_EMPLOYEES
  const depts = analytics?.by_department ?? []

  const filterGroups: HrFilterGroup[] = [
    {
      id: "department",
      label: "Department",
      options: depts.map((dept) => ({
        value: dept.dept_name,
        label: dept.dept_name,
      })),
    },
  ]

  const deptFilter = filters.department ?? []
  const visibleDepts =
    deptFilter.length === 0
      ? depts
      : depts.filter((dept) => deptFilter.includes(dept.dept_name))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <StatPanelSkeleton />
            <StatPanelSkeleton />
            <StatPanelSkeleton />
            <StatPanelSkeleton />
          </>
        ) : (
          <>
            <StatPanel
              label="Total Payroll"
              value={formatEGP(analytics?.total_payroll.amount ?? 0)}
              trend={
                analytics?.total_payroll.mom_change_pct
                  ? `+${analytics.total_payroll.mom_change_pct.toFixed(1)}% from last month`
                  : undefined
              }
              icon={<DollarSign className="size-4" strokeWidth={1.75} />}
            />
            <StatPanel
              label="Average Salary"
              value={formatEGP(analytics?.average_salary.amount ?? 0)}
              description={
                analytics
                  ? `Based on ${analytics.average_salary.employee_count} employees`
                  : undefined
              }
              icon={<DollarSign className="size-4" strokeWidth={1.75} />}
            />
            <StatPanel
              label="Highest Dept Avg"
              value={formatEGP(analytics?.highest_dept_avg?.amount ?? 0)}
              description={analytics?.highest_dept_avg?.department}
              icon={<TrendingUp className="size-4" strokeWidth={1.75} />}
              tone="emerald"
            />
            <StatPanel
              label="MoM Change"
              value={
                analytics?.mom_change_pct != null
                  ? `${analytics.mom_change_pct >= 0 ? "+" : ""}${analytics.mom_change_pct.toFixed(1)}%`
                  : "—"
              }
              description="vs previous month"
              icon={<TrendingUp className="size-4" strokeWidth={1.75} />}
              tone="emerald"
            />
          </>
        )}
      </div>

      <div className="border-stroke-default bg-surface-white flex flex-col gap-5 rounded-[14px] border p-5">
        <HrToolbar
          primary={
            <Button
              variant="primary"
              className="rounded-[10px]"
              onClick={() => setSalaryDialogOpen(true)}
            >
              <Plus />
              Salary Change
            </Button>
          }
          searchValue={search}
          onSearchChange={setSearch}
          filterGroups={filterGroups}
          filterValues={filters}
          onFilterChange={setFilters}
        />

        {visibleDepts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SalaryCostByDepartment rows={visibleDepts} />
            <DepartmentBreakdown rows={visibleDepts} />
          </div>
        )}

        {!isLoading && depts.length === 0 && (
          <p className="text-content-tertiary py-8 text-center text-sm">
            No salary data available yet.
          </p>
        )}
      </div>

      <SalaryChangeDialog
        open={salaryDialogOpen}
        onOpenChange={setSalaryDialogOpen}
        employees={employees}
        employeesLoading={employeesLoading}
      />
    </div>
  )
}
