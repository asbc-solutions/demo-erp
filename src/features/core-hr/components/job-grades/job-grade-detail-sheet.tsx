"use client"

import { Briefcase, CheckCircle2, XCircle } from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/ui/sheet"
import { cn } from "@/src/shared/lib/utils/utils"

import type { JobGradeListItem } from "../../lib/types"
import { useJobGrade } from "../../lib/queries/job-grades"
import { CATEGORY_BADGE, CATEGORY_LABEL, formatMoney } from "./grade-meta"

type JobGradeDetailSheetProps = Readonly<{
  grade: JobGradeListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>

function Row({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-content-tertiary text-sm leading-5">{label}</span>
      <span className="text-content-primary text-sm leading-5 font-medium">
        {children}
      </span>
    </div>
  )
}

function SectionTitle({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <h3 className="text-content-primary mb-1 text-sm leading-5 font-semibold">
      {children}
    </h3>
  )
}

export function JobGradeDetailSheet({
  grade,
  open,
  onOpenChange,
}: JobGradeDetailSheetProps) {
  // linked_jobs only come from the detail endpoint; the rest is on the list item.
  const { data: detail, isLoading } = useJobGrade(open && grade ? grade.id : "")

  if (!grade) return null

  const { min_salary, mid_salary, max_salary, currency_code } = grade
  const range = max_salary - min_salary
  const fillPercent =
    range > 0
      ? Math.max(0, Math.min(100, ((mid_salary - min_salary) / range) * 100))
      : 50
  const rangeSpread =
    min_salary > 0 ? Math.round(((max_salary - min_salary) / min_salary) * 100) : 0
  const linkedJobs = detail?.linked_jobs ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-stroke-default border-b px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <SheetTitle className="text-content-primary text-lg leading-6 font-semibold">
              {grade.grade_name}
            </SheetTitle>
            <p className="text-content-tertiary font-mono text-sm">
              {grade.grade_code}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-transparent px-2.5 py-0.5 text-[11px] tracking-[0.4px] capitalize",
                  CATEGORY_BADGE[grade.grade_category],
                )}
              >
                {CATEGORY_LABEL[grade.grade_category]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px]",
                  grade.is_active
                    ? "border-brand-success/30 bg-brand-success/10 text-brand-success"
                    : "border-stroke-default bg-surface-hover text-content-tertiary",
                )}
              >
                {grade.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col px-6">
          {/* Grade Information */}
          <section className="border-stroke-default/50 border-b py-4">
            <SectionTitle>Grade Information</SectionTitle>
            <Row label="Grade">
              {grade.grade_code} · {grade.grade_name}
            </Row>
            <Row label="Level">{grade.grade_level}</Row>
            <Row label="Category">{CATEGORY_LABEL[grade.grade_category]}</Row>
            <Row label="Employees">{grade.employee_count}</Row>
            <Row label="Positions">{grade.position_count}</Row>
          </section>

          {/* Salary Band */}
          <section className="border-stroke-default/50 border-b py-4">
            <SectionTitle>Salary Band</SectionTitle>
            <Row label="Minimum">
              <span className="font-mono">{formatMoney(min_salary, currency_code)}</span>
            </Row>
            <Row label="Midpoint">
              <span className="font-mono">{formatMoney(mid_salary, currency_code)}</span>
            </Row>
            <Row label="Maximum">
              <span className="font-mono">{formatMoney(max_salary, currency_code)}</span>
            </Row>
            <Row label="Range Spread">{rangeSpread}%</Row>
            <div className="bg-stroke-default relative mt-2 h-2 w-full overflow-hidden rounded-full">
              <span
                aria-hidden
                className="bg-brand-primary absolute inset-y-0 inset-s-0 rounded-full transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </section>

          {/* Entitlements */}
          <section className="border-stroke-default/50 border-b py-4">
            <SectionTitle>Entitlements</SectionTitle>
            <Row label="Annual Leave">{grade.annual_leave_days} days</Row>
            <Row label="Sick Leave">{grade.sick_leave_days} days</Row>
            <Row label="Overtime">
              {grade.overtime_eligible ? (
                <span className="text-brand-success inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" strokeWidth={2} />
                  Eligible
                </span>
              ) : (
                <span className="text-content-tertiary inline-flex items-center gap-1">
                  <XCircle className="size-3.5" strokeWidth={2} />
                  Not eligible
                </span>
              )}
            </Row>
          </section>

          {/* Linked Jobs */}
          <section className="py-4">
            <SectionTitle>Linked Jobs</SectionTitle>
            {isLoading ? (
              <p className="text-content-tertiary py-2 text-sm">Loading…</p>
            ) : linkedJobs.length === 0 ? (
              <p className="text-content-tertiary py-2 text-sm">
                No jobs are linked to this grade.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {linkedJobs.map((job) => (
                  <li
                    key={job.id}
                    className="border-stroke-default bg-surface-white flex items-center gap-3 rounded-[10px] border px-3 py-2"
                  >
                    <span
                      aria-hidden
                      className="bg-brand-primary/10 text-brand-primary flex size-8 shrink-0 items-center justify-center rounded-full"
                    >
                      <Briefcase className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-content-primary truncate text-sm leading-5 font-medium">
                        {job.job_title}
                      </span>
                      <span className="text-content-tertiary truncate font-mono text-xs leading-4">
                        {job.job_code}
                      </span>
                    </div>
                    {!job.is_active && (
                      <span className="text-content-tertiary text-xs">Inactive</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
