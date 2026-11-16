"use client"

import { useMemo } from "react"
import {
  ArrowLeftRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Shield,
  ShieldCheck,
  User,
  X,
} from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/ui/sheet"
import { cn } from "@/src/shared/lib/utils/utils"

import type {
  ApprovalRequest,
  ApprovalRequestType,
  ApprovalWorkflowStep,
  ApprovalWorkflowStepVariant,
} from "../../types/approval"
import { AVATAR_TONE_CLASSES } from "../shared/avatar-tone"

const TYPE_LABEL: Record<ApprovalRequestType, string> = {
  TRANSFER: "Transfer",
  PROMOTION: "Promotion",
  LEAVE: "Leave",
  SALARY_CHANGE: "Salary Change",
  CONTRACT: "Contract",
  TERMINATION: "Termination",
  GENERAL: "General",
}

const TYPE_REQUEST_LABEL: Record<ApprovalRequestType, string> = {
  TRANSFER: "Transfer Request",
  PROMOTION: "Promotion Request",
  LEAVE: "Leave Request",
  SALARY_CHANGE: "Salary Change Request",
  CONTRACT: "Contract Request",
  TERMINATION: "Termination Request",
  GENERAL: "General Request",
}

const TYPE_BADGE_CLASS: Record<ApprovalRequestType, string> = {
  TRANSFER:
    "border-transparent bg-violet-500/12 text-violet-700 dark:text-violet-300",
  PROMOTION: "border-transparent bg-brand-success/12 text-brand-success",
  LEAVE: "border-transparent bg-brand-info/12 text-brand-info",
  SALARY_CHANGE: "border-transparent bg-brand-warning/12 text-brand-warning",
  CONTRACT: "border-transparent bg-brand-primary/12 text-brand-primary",
  TERMINATION: "border-transparent bg-brand-danger/12 text-brand-danger",
  GENERAL: "border-transparent bg-surface-hover text-content-secondary",
}

const STATUS_BADGE_CLASS = {
  DRAFT: "border-transparent bg-surface-hover text-content-secondary",
  PENDING: "border-transparent bg-brand-warning/15 text-brand-warning",
  APPROVED: "border-transparent bg-brand-success/15 text-brand-success",
  REJECTED: "border-transparent bg-brand-danger/15 text-brand-danger",
  RETURNED: "border-transparent bg-brand-info/15 text-brand-info",
} as const

const STATUS_LABEL = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RETURNED: "Returned",
} as const

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function fallbackWorkflow(request: ApprovalRequest): ApprovalWorkflowStep[] {
  const submittedAt = (time: string) =>
    request.dateSubmitted ? `${request.dateSubmitted} ${time}` : undefined

  if (request.status === "REJECTED" || request.status === "RETURNED") {
    const decisionVariant =
      request.status === "RETURNED" ? "returned" : "rejected"
    return [
      {
        id: "r1",
        title: "Submitted",
        assignee: request.requestedBy,
        completedAt: submittedAt("10:00"),
        variant: "complete",
      },
      {
        id: "r2",
        title:
          request.status === "RETURNED"
            ? "Returned for changes"
            : "HR Manager Review",
        assignee: request.requestedBy,
        completedAt: submittedAt("14:00"),
        variant: decisionVariant,
      },
      {
        id: "r3",
        title: "Department Head Approval",
        assignee: "Hassan Mohamed",
        variant: "pending",
      },
      {
        id: "r4",
        title: "Final Confirmation",
        assignee: "System",
        variant: "pending",
      },
    ]
  }

  const pending = request.status === "PENDING"
  return [
    {
      id: "f1",
      title: "Submitted",
      assignee: request.requestedBy,
      completedAt: submittedAt("09:00"),
      variant: "complete",
    },
    {
      id: "f2",
      title: "In review",
      assignee: request.requestedBy,
      variant: pending ? "current" : "complete",
      completedAt: pending ? undefined : submittedAt("14:00"),
    },
    {
      id: "f3",
      title: "Final Confirmation",
      assignee: "System",
      variant: pending ? "pending" : "complete",
      completedAt: pending ? undefined : submittedAt("16:00"),
    },
  ]
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: typeof User
  label: string
  value: string
}>) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-content-quaternary">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs leading-4 text-content-tertiary">{label}</span>
        <span className="text-sm font-medium text-content-primary">
          {value}
        </span>
      </div>
    </div>
  )
}

const TIMELINE_TITLE_CLASS: Record<ApprovalWorkflowStepVariant, string> = {
  current: "text-content-primary font-semibold",
  complete: "text-content-primary font-medium",
  pending: "text-content-tertiary",
  rejected: "text-content-primary font-semibold",
  returned: "text-content-primary font-semibold",
  delegated: "text-content-primary font-medium",
}

const DEFAULT_REJECTED_IMPACT_LINES = [
  "This request was rejected. No payroll or employee record changes apply.",
  "You may open a new request if policy allows.",
]

function TimelineStepIcon({ step }: Readonly<{ step: ApprovalWorkflowStep }>) {
  if (step.variant === "rejected") {
    return <X className="size-4" strokeWidth={2} />
  }
  if (step.variant === "returned") {
    return <ArrowLeftRight className="size-4" strokeWidth={1.75} />
  }
  if (step.variant === "delegated") {
    return <Shield className="size-4" strokeWidth={1.75} />
  }
  if (step.variant === "complete") {
    return <Check className="size-4" strokeWidth={2} />
  }
  if (step.variant === "current") {
    return <Clock className="size-4" strokeWidth={1.75} />
  }
  return <span className="size-2 rounded-full bg-content-quaternary/40" />
}

function TimelineStep({
  step,
  isLast,
}: Readonly<{ step: ApprovalWorkflowStep; isLast: boolean }>) {
  const isComplete = step.variant === "complete"
  const isCurrent = step.variant === "current"
  const isRejected = step.variant === "rejected"
  const isReturned = step.variant === "returned"
  const isDelegated = step.variant === "delegated"

  return (
    <li className="relative flex gap-4 ps-0.5">
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            "absolute top-9 inset-s-[15px] h-[calc(100%-8px)] w-px",
            isComplete && "bg-brand-success",
            isRejected && "bg-brand-danger",
            isReturned && "bg-brand-info",
            isDelegated && "bg-violet-500/50",
            isCurrent && "bg-violet-500/35",
            !isComplete &&
              !isCurrent &&
              !isRejected &&
              !isReturned &&
              !isDelegated &&
              "bg-stroke-default"
          )}
        />
      )}
      <span
        aria-hidden
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
          isComplete && "border-brand-success bg-brand-success text-white",
          isRejected &&
            "border-brand-danger bg-brand-danger/10 text-brand-danger",
          isReturned && "border-brand-info bg-brand-info/10 text-brand-info",
          isDelegated &&
            "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300",
          isCurrent &&
            "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300",
          !isComplete &&
            !isCurrent &&
            !isRejected &&
            !isReturned &&
            !isDelegated &&
            "border-stroke-default bg-surface-white text-content-quaternary"
        )}
      >
        <TimelineStepIcon step={step} />
      </span>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5",
          !isLast && "pb-6"
        )}
      >
        <p
          className={cn(
            "text-sm leading-5",
            TIMELINE_TITLE_CLASS[step.variant]
          )}
        >
          {step.title}
        </p>
        {step.assignee && (
          <p className="text-xs leading-4 text-content-tertiary">
            {step.assignee}
          </p>
        )}
        {step.completedAt && (
          <p className="font-mono text-[11px] leading-4 text-content-quaternary">
            {step.completedAt}
          </p>
        )}
      </div>
    </li>
  )
}

type ApprovalRequestDetailSheetProps = Readonly<{
  request: ApprovalRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (request: ApprovalRequest) => void
  onReject: (request: ApprovalRequest) => void
}>

function resolveWorkflowSteps(
  request: ApprovalRequest
): ApprovalWorkflowStep[] {
  if (request.workflowSteps?.length) {
    return request.workflowSteps
  }
  return fallbackWorkflow(request)
}

export function ApprovalRequestDetailSheet({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ApprovalRequestDetailSheetProps) {
  const steps = useMemo(
    () => (request ? resolveWorkflowSteps(request) : []),
    [request]
  )

  const headline = request?.detailHeadline ?? request?.detailsSummary ?? ""

  const showTransferBlock =
    request?.type === "TRANSFER" &&
    (request.transferFromBranch ||
      request.transferToBranch ||
      request.transferToDepartment)

  const showPromotionBlock =
    request?.type === "PROMOTION" &&
    (request.promotionFromTitle || request.promotionToTitle)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {request ? (
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 overflow-hidden border-s border-stroke-default bg-surface-page p-0 sm:max-w-[min(1024px,calc(100vw-1.5rem))] data-[side=right]:sm:max-w-none"
        >
          <SheetHeader className="shrink-0 space-y-0 border-b border-stroke-default px-6 py-5 text-start">
            <nav
              className="mb-3 flex flex-wrap items-center gap-1 text-xs text-content-tertiary"
              aria-label="Breadcrumb"
            >
              <button
                type="button"
                className="font-medium text-brand-primary hover:text-brand-primary-hover"
                onClick={() => onOpenChange(false)}
              >
                Approvals
              </button>
              <ChevronRight className="size-3.5 opacity-50" aria-hidden />
              <span className="text-content-secondary">
                {TYPE_REQUEST_LABEL[request.type]}
              </span>
              <ChevronRight className="size-3.5 opacity-50" aria-hidden />
              <span className="font-medium text-content-primary">
                {request.requestNumber}
              </span>
            </nav>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="font-heading text-xl leading-7 font-semibold text-content-primary">
                    {request.requestNumber}
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium",
                      TYPE_BADGE_CLASS[request.type]
                    )}
                  >
                    {TYPE_LABEL[request.type]}
                  </Badge>
                </div>
                <SheetDescription className="text-sm leading-5 text-content-tertiary">
                  {headline}
                </SheetDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium",
                  STATUS_BADGE_CLASS[request.status]
                )}
              >
                {STATUS_LABEL[request.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 lg:flex-row lg:gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <section className="rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
                <header className="flex items-center gap-2 border-b border-stroke-default px-5 py-4 text-base font-semibold text-content-primary">
                  <FileText
                    className="size-5 text-content-quaternary"
                    strokeWidth={1.75}
                  />
                  Request Details
                </header>
                <div className="flex flex-col gap-5 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <Avatar
                      size="default"
                      alt={request.employeeName}
                      className={cn(
                        "font-semibold",
                        AVATAR_TONE_CLASSES[request.employeeAvatarTone]
                      )}
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-base font-semibold text-content-primary">
                        {request.employeeName}
                      </p>
                      <p className="font-mono text-xs text-content-tertiary">
                        {request.employeeNumber}
                      </p>
                      {(request.employeeRole || request.employeeDepartment) && (
                        <p className="text-sm text-content-secondary">
                          {[request.employeeRole, request.employeeDepartment]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MetaItem
                      icon={User}
                      label="Requested by"
                      value={request.requestedBy}
                    />
                    <MetaItem
                      icon={Calendar}
                      label="Submitted date"
                      value={formatDate(request.dateSubmitted)}
                    />
                    <MetaItem
                      icon={Calendar}
                      label="Effective date"
                      value={
                        request.effectiveDate
                          ? formatDate(request.effectiveDate)
                          : "—"
                      }
                    />
                    <MetaItem
                      icon={FileText}
                      label="Reason"
                      value={request.reason ?? "—"}
                    />
                  </div>
                </div>
              </section>

              {showTransferBlock && (
                <section className="rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
                  <header className="flex items-center gap-2 border-b border-stroke-default px-5 py-4 text-base font-semibold text-content-primary">
                    <ArrowLeftRight
                      className="size-5 text-content-quaternary"
                      strokeWidth={1.75}
                    />
                    Transfer Details
                  </header>
                  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-content-tertiary">
                        From branch
                      </span>
                      <span className="text-sm font-medium text-content-primary">
                        {request.transferFromBranch ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-content-tertiary">
                        To branch
                      </span>
                      <span className="text-sm font-medium text-content-primary">
                        {request.transferToBranch ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs text-content-tertiary">
                        Department
                      </span>
                      <span className="text-sm font-medium text-content-primary">
                        {request.transferToDepartment ?? "—"}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {showPromotionBlock && (
                <section className="rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
                  <header className="flex items-center gap-2 border-b border-stroke-default px-5 py-4 text-base font-semibold text-content-primary">
                    <ArrowLeftRight
                      className="size-5 text-content-quaternary"
                      strokeWidth={1.75}
                    />
                    Promotion Details
                  </header>
                  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-content-tertiary">
                        Current title
                      </span>
                      <span className="text-sm font-medium text-content-primary">
                        {request.promotionFromTitle ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-content-tertiary">
                        New title
                      </span>
                      <span className="text-sm font-medium text-content-primary">
                        {request.promotionToTitle ?? "—"}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {request.status === "REJECTED" && (
                <section className="rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
                  <header className="flex items-center gap-2 border-b border-stroke-default px-5 py-4 text-base font-semibold text-content-primary">
                    <Shield
                      className="size-5 text-content-quaternary"
                      strokeWidth={1.75}
                    />
                    Impact Summary
                  </header>
                  <ul className="list-disc space-y-2 px-5 py-5 ps-9 text-sm leading-5 text-content-secondary">
                    {(
                      request.impactSummaryLines ??
                      DEFAULT_REJECTED_IMPACT_LINES
                    ).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="flex w-full shrink-0 flex-col rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] lg:w-[320px]">
              <header className="flex items-center gap-2 border-b border-stroke-default px-5 py-4 text-base font-semibold text-content-primary">
                <ShieldCheck
                  className="size-5 text-content-quaternary"
                  strokeWidth={1.75}
                />
                Approval Progress
              </header>
              <ol className="px-5 py-5">
                {steps.map((step, index) => (
                  <TimelineStep
                    key={step.id}
                    step={step}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </ol>
            </aside>
          </div>

          {request.status === "PENDING" && (
            <SheetFooter className="mt-0 shrink-0 flex-row justify-end gap-2 border-t border-stroke-default bg-surface-white px-6 py-4">
              <Button
                variant="outline"
                size="default"
                className="rounded-[10px] border-brand-danger text-brand-danger hover:bg-brand-danger/5"
                onClick={() => onReject(request)}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="default"
                className="rounded-[10px]"
                onClick={() => onApprove(request)}
              >
                Approve
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      ) : null}
    </Sheet>
  )
}
