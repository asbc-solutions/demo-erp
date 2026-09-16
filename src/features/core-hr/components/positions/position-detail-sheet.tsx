"use client"

import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Lock,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/ui/sheet"
import { cn } from "@/src/shared/lib/utils/utils"

import { useJobs } from "../../lib/queries/jobs"
import {
  useActiveBranchOptions,
  useActiveDepartmentOptions,
} from "../../lib/queries/org-selectors"
import type { PositionListItem, PositionStatus, VacancyStatus } from "../../lib/types"

type PositionDetailSheetProps = Readonly<{
  position: PositionListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}>

// Pull enough active jobs in one page to resolve a position's job_id to a title.
const JOB_LOOKUP_PARAMS = { is_active: true, per_page: 200 } as const

const POSITION_STATUS_BADGE: Record<PositionStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "border-brand-success/30 bg-brand-success/10 text-brand-success" },
  filled: { label: "Filled", className: "border-brand-primary/30 bg-brand-primary/10 text-brand-primary" },
  frozen: { label: "Frozen", className: "border-brand-warning/30 bg-brand-warning/10 text-brand-warning" },
  closed: { label: "Closed", className: "border-stroke-default bg-surface-hover text-content-tertiary" },
  on_hold: { label: "On Hold", className: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger" },
}

const VACANCY_STATUS_BADGE: Record<VacancyStatus, { label: string; className: string }> = {
  open: { label: "Open — No Assignees", className: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger" },
  partial: { label: "Partial", className: "border-brand-warning/30 bg-brand-warning/10 text-brand-warning" },
  filled: { label: "Fully Filled", className: "border-brand-success/30 bg-brand-success/10 text-brand-success" },
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="text-content-tertiary mt-0.5 flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-content-quaternary text-[11px] leading-4 uppercase tracking-[0.4px]">
          {label}
        </span>
        <span className="text-content-primary text-sm leading-5 font-medium">
          {children}
        </span>
      </div>
    </div>
  )
}

export function PositionDetailSheet({
  position,
  open,
  onOpenChange,
}: PositionDetailSheetProps) {
  // Reference data to resolve the position's dept/branch/job IDs to names.
  // Shares react-query cache with the create/edit dialogs' selectors.
  const { data: deptData } = useActiveDepartmentOptions({ enabled: open })
  const { data: branchData } = useActiveBranchOptions({ enabled: open })
  const { data: jobData } = useJobs(JOB_LOOKUP_PARAMS, { enabled: open })

  if (!position) return null

  const deptName = position.dept_id
    ? deptData?.data.find((d) => d.id === position.dept_id)?.dept_name ?? null
    : null
  const branchName = position.branch_id
    ? branchData?.data.find((b) => b.id === position.branch_id)?.branch_name ?? null
    : null
  const jobTitle = position.job_id
    ? jobData?.data.find((j) => j.id === position.job_id)?.job_title ?? null
    : null

  const psConfig = POSITION_STATUS_BADGE[position.position_status]
  const vsConfig = VACANCY_STATUS_BADGE[position.vacancy_status]
  const headcountPercent =
    position.headcount_budget === 0
      ? 0
      : Math.min(100, (position.headcount_filled / position.headcount_budget) * 100)
  const barColor =
    headcountPercent >= 100
      ? "bg-brand-success"
      : headcountPercent >= 50
        ? "bg-brand-warning"
        : "bg-brand-danger"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-stroke-default border-b px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <SheetTitle className="text-content-primary text-lg font-semibold leading-6">
              {position.position_title}
            </SheetTitle>
            <p className="text-content-tertiary font-mono text-sm">
              {position.position_code}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.4px] ${psConfig.className}`}
              >
                {psConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.4px] ${vsConfig.className}`}
              >
                {vsConfig.label}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col divide-y divide-stroke-default/50 px-6">
          {/* Headcount bar */}
          <div className="py-4">
            <p className="text-content-quaternary mb-2 text-[11px] uppercase tracking-[0.4px]">
              Headcount
            </p>
            <div className="flex items-center justify-between text-sm font-medium mb-1.5">
              <span className="text-content-primary">
                {position.headcount_filled}
                <span className="text-content-quaternary"> / {position.headcount_budget} filled</span>
              </span>
              <span className="text-content-tertiary text-xs">
                {position.headcount_vacant} vacant
              </span>
            </div>
            <div className="bg-stroke-default relative h-2 w-full overflow-hidden rounded-full">
              <span
                aria-hidden
                className={cn("absolute inset-y-0 left-0 rounded-full transition-all", barColor)}
                style={{ width: `${headcountPercent}%` }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-stroke-default/50">
            <DetailRow
              icon={<Building2 className="size-4" strokeWidth={1.75} />}
              label="Department"
            >
              {deptName ?? <span className="text-content-quaternary">—</span>}
            </DetailRow>

            <DetailRow
              icon={<Building2 className="size-4" strokeWidth={1.75} />}
              label="Branch"
            >
              {branchName ?? <span className="text-content-quaternary">—</span>}
            </DetailRow>

            <DetailRow
              icon={<Briefcase className="size-4" strokeWidth={1.75} />}
              label="Job"
            >
              {jobTitle ?? <span className="text-content-quaternary">—</span>}
            </DetailRow>

            <DetailRow
              icon={
                position.is_budgeted ? (
                  <CheckCircle2 className="size-4 text-brand-success" strokeWidth={1.75} />
                ) : (
                  <Lock className="size-4" strokeWidth={1.75} />
                )
              }
              label="Budget"
            >
              {position.is_budgeted ? "Budgeted" : "Unbudgeted"}
            </DetailRow>

            <DetailRow
              icon={<Users className="size-4" strokeWidth={1.75} />}
              label="Active"
            >
              {position.is_active ? (
                <span className="text-brand-success inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" strokeWidth={2} />
                  Active
                </span>
              ) : (
                <span className="text-content-tertiary inline-flex items-center gap-1">
                  <XCircle className="size-3.5" strokeWidth={2} />
                  Inactive
                </span>
              )}
            </DetailRow>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
