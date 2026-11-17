"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  SlidersHorizontal,
  Timer,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { Textarea } from "@/src/shared/components/ui/textarea"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import {
  useApproveRequest,
  useRejectRequest,
} from "../../lib/mutations/approvals"
import {
  useApproval,
  useApprovals,
  usePendingApprovalsForMe,
} from "../../lib/queries/approvals"
import { useEmployees } from "../../lib/queries/employees"
import type {
  ApprovalApiRequestType,
  ApprovalApiStatus,
  ApprovalRequestDetail,
  ApprovalRequestSummary,
  ApprovalStepHistoryItem,
  EmployeeListItem,
} from "../../lib/types"
import type { AvatarTone } from "../../types/employee"
import type {
  ApprovalRequest,
  ApprovalRequestStatus,
  ApprovalRequestType,
  ApprovalWorkflowStep,
  ApprovalWorkflowStepVariant,
} from "../../types/approval"
import { AVATAR_TONE_CLASSES } from "../shared/avatar-tone"
import { ApprovalRequestDetailSheet } from "./approval-request-detail-sheet"

const EMPTY_APPROVALS: ApprovalRequestSummary[] = []
const EMPTY_EMPLOYEES: EmployeeListItem[] = []

type ApprovalsTranslator = ReturnType<typeof useTranslations<"HrApprovals">>

const TYPE_FILTERS: (ApprovalRequestType | "ALL")[] = [
  "ALL",
  "TRANSFER",
  "PROMOTION",
  "TERMINATION",
  "SALARY_CHANGE",
  "GENERAL",
]

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

const STATUS_BADGE_CLASS: Record<ApprovalRequestStatus, string> = {
  DRAFT: "border-transparent bg-surface-hover text-content-secondary",
  PENDING: "border-transparent bg-brand-warning/15 text-brand-warning",
  APPROVED: "border-transparent bg-brand-success/15 text-brand-success",
  REJECTED: "border-transparent bg-brand-danger/15 text-brand-danger",
  RETURNED: "border-transparent bg-brand-info/15 text-brand-info",
}

const STATUS_FILTERS: (ApprovalRequestStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RETURNED",
  "DRAFT",
]

const API_TYPE_TO_UI: Record<ApprovalApiRequestType, ApprovalRequestType> = {
  transfer: "TRANSFER",
  promotion: "PROMOTION",
  termination: "TERMINATION",
  salary_change: "SALARY_CHANGE",
  general: "GENERAL",
}

const UI_TYPE_TO_API: Partial<
  Record<ApprovalRequestType, ApprovalApiRequestType>
> = {
  TRANSFER: "transfer",
  PROMOTION: "promotion",
  TERMINATION: "termination",
  SALARY_CHANGE: "salary_change",
  GENERAL: "general",
}

const API_STATUS_TO_UI: Record<ApprovalApiStatus, ApprovalRequestStatus> = {
  draft: "DRAFT",
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  returned: "RETURNED",
}

const UI_STATUS_TO_API: Record<ApprovalRequestStatus, ApprovalApiStatus> = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
}

const TONES: AvatarTone[] = ["indigo", "amber", "emerald", "rose", "violet"]

type StatTone = "rose" | "violet"

const STAT_TONE_ICON: Record<StatTone, string> = {
  rose: "bg-brand-danger/10 text-brand-danger",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

function StatCard({
  label,
  value,
  description,
  icon,
  tone,
}: Readonly<{
  label: string
  value: React.ReactNode
  description: string
  icon: React.ReactNode
  tone: StatTone
}>) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[14px] border border-stroke-default bg-surface-white px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] tracking-[0.4px] text-content-tertiary uppercase">
          {label}
        </span>
        <span className="text-2xl leading-8 font-semibold text-content-primary">
          {value}
        </span>
        <span className="text-xs leading-4 text-content-tertiary">
          {description}
        </span>
      </div>
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
          STAT_TONE_ICON[tone]
        )}
      >
        {icon}
      </span>
    </div>
  )
}

function ApprovalTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          <TableCell className="ps-6">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24 rounded-md" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-md" />
          </TableCell>
          <TableCell className="pe-6">
            <Skeleton className="ms-auto h-8 w-32 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

function dateFromIso(iso: string | null | undefined) {
  if (!iso) return null
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateKey(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : null
}

function formatSubmitted(iso: string | null | undefined, intlLocale: string) {
  const date = dateFromIso(iso)
  if (!date) return iso ?? "—"
  return date.toLocaleDateString(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimestamp(iso: string | null | undefined, intlLocale: string) {
  if (!iso) return undefined
  const date = dateFromIso(iso)
  if (!date) return iso
  return date.toLocaleString(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function labelize(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function deriveTone(seed: string): AvatarTone {
  const total = Array.from(seed).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  )
  return TONES[total % TONES.length]
}

function contextValue(value: unknown): string | undefined {
  if (value == null || value === "") return undefined
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (Array.isArray(value)) {
    const values = value
      .map((item) => contextValue(item))
      .filter((item): item is string => Boolean(item))
    return values.length ? values.join(", ") : undefined
  }
  return undefined
}

function contextText(
  context: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  if (!context) return undefined
  for (const key of keys) {
    const value = contextValue(context[key])
    if (value) return value
  }
  return undefined
}

function contextSummary(
  context: Record<string, unknown> | null | undefined,
  fallback: string
) {
  const direct = contextText(context, [
    "description",
    "summary",
    "title",
    "reason",
    "change_reason",
  ])
  if (direct) return direct

  if (!context) return fallback
  const entry = Object.entries(context).find(([, value]) => contextValue(value))
  if (!entry) return fallback
  return `${labelize(entry[0])}: ${contextValue(entry[1])}`
}

function stepVariant(
  step: ApprovalStepHistoryItem,
  currentStep: number
): ApprovalWorkflowStepVariant {
  if (step.status === "approved") return "complete"
  if (step.status === "rejected") return "rejected"
  if (step.status === "returned") return "returned"
  if (step.status === "delegated") return "delegated"
  return step.step_number === currentStep ? "current" : "pending"
}

type MapContext = Readonly<{
  t: ApprovalsTranslator
  intlLocale: string
}>

function mapWorkflowStep(
  step: ApprovalStepHistoryItem,
  currentStep: number,
  { t, intlLocale }: MapContext
): ApprovalWorkflowStep {
  const roleLabel = step.approver_role
    ? labelize(step.approver_role)
    : undefined
  const assignee = step.approver_user_id
    ? t("userRef", { id: step.approver_user_id })
    : roleLabel

  return {
    id: `${step.step_number}-${step.status}-${step.approver_user_id ?? "role"}`,
    title: roleLabel ?? t("stepNumber", { number: step.step_number }),
    assignee: step.delegated_to
      ? t("delegatedTo", {
          assignee: assignee ?? t("approverFallback"),
          id: step.delegated_to,
        })
      : assignee,
    completedAt: formatTimestamp(step.decision_date, intlLocale),
    variant: stepVariant(step, currentStep),
  }
}

function mapApprovalRequest(
  request: ApprovalRequestSummary | ApprovalRequestDetail,
  employeesById: Map<string, EmployeeListItem>,
  ctx: MapContext
): ApprovalRequest {
  const { t } = ctx
  const type = API_TYPE_TO_UI[request.request_type] ?? "GENERAL"
  const status = API_STATUS_TO_UI[request.status] ?? "PENDING"
  const context =
    "context_data" in request ? (request.context_data ?? undefined) : undefined
  const notes = "notes" in request ? (request.notes ?? undefined) : undefined
  const employee = request.target_id
    ? employeesById.get(request.target_id)
    : undefined
  const employeeName =
    employee?.full_name ??
    contextText(context, ["employee_name", "target_name", "name"]) ??
    (request.target_id
      ? t("employeeRef", { id: request.target_id.slice(0, 8) })
      : t("generalRequest"))
  const typeSummary = t("typeRequestSummary", {
    type: request.request_type_label,
  })
  const summary = contextSummary(context, notes ?? typeSummary) ?? typeSummary
  const workflowSteps =
    "step_history" in request && request.step_history?.length
      ? request.step_history.map((step) =>
          mapWorkflowStep(step, request.current_step, ctx)
        )
      : undefined
  const decisionNotes =
    "step_history" in request
      ? request.step_history
          ?.map((step) => step.decision_notes)
          .filter((note): note is string => Boolean(note))
      : undefined

  return {
    id: request.id,
    requestNumber:
      contextText(context, ["request_number", "requestNumber"]) ??
      `APR-${request.id.slice(0, 8).toUpperCase()}`,
    type,
    employeeName,
    employeeNumber:
      employee?.employee_number ??
      (request.target_id
        ? request.target_id.slice(0, 8).toUpperCase()
        : t("noTarget")),
    employeeAvatarTone: deriveTone(employee?.full_name ?? request.id),
    requestedBy: t("userRef", { id: request.requested_by }),
    dateSubmitted: request.requested_at,
    completedAt: request.completed_at,
    detailsSummary: summary,
    status,
    detailHeadline: summary,
    employeeRole: contextText(context, [
      "employee_role",
      "current_title",
      "position",
      "job_title",
    ]),
    employeeDepartment: contextText(context, [
      "department",
      "dept_name",
      "to_department",
      "new_department",
    ]),
    effectiveDate: contextText(context, ["effective_date", "effectiveDate"]),
    reason: contextText(context, ["reason", "change_reason"]) ?? notes,
    transferFromBranch: contextText(context, ["from_branch", "current_branch"]),
    transferToBranch: contextText(context, ["to_branch", "new_branch"]),
    transferToDepartment: contextText(context, [
      "to_department",
      "new_department",
    ]),
    promotionFromTitle: contextText(context, [
      "from_title",
      "current_title",
      "old_title",
    ]),
    promotionToTitle: contextText(context, [
      "to_title",
      "new_title",
      "promoted_to",
    ]),
    workflowSteps,
    impactSummaryLines:
      status === "REJECTED" && decisionNotes?.length
        ? decisionNotes.map((note) => t("decisionNotes", { note }))
        : undefined,
  }
}

function averageResponseHours(rows: ApprovalRequest[]) {
  const durations = rows
    .map((row) => {
      if (!row.completedAt) return null
      const start = dateFromIso(row.dateSubmitted)
      const end = dateFromIso(row.completedAt)
      if (!start || !end) return null
      return Math.max(0, end.getTime() - start.getTime()) / 3_600_000
    })
    .filter((value): value is number => value != null)

  if (!durations.length) return 0
  const avg =
    durations.reduce((sum, value) => sum + value, 0) / durations.length
  return Number(avg.toFixed(1))
}

function isCurrentMonth(iso: string | null | undefined) {
  if (!iso) return false
  const date = dateFromIso(iso)
  if (!date) return false
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  )
}

export function ApprovalsTab() {
  const t = useTranslations("HrApprovals")
  const tCommon = useTranslations("Common")
  const intlLocale = useIntlLocale()
  const [typeFilter, setTypeFilter] = useState<ApprovalRequestType | "ALL">(
    "ALL"
  )
  const [statusFilter, setStatusFilter] = useState<
    ApprovalRequestStatus | "ALL"
  >("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const listParams = useMemo(
    () => ({
      per_page: 50,
      request_type:
        typeFilter === "ALL" ? undefined : UI_TYPE_TO_API[typeFilter],
      status:
        statusFilter === "ALL" ? undefined : UI_STATUS_TO_API[statusFilter],
    }),
    [statusFilter, typeFilter]
  )

  const { data, isLoading, isError } = useApprovals(listParams)
  const { data: pendingForMe } = usePendingApprovalsForMe()
  const { data: employeesData } = useEmployees({ per_page: 200 })
  const { data: selectedDetail } = useApproval(selectedId ?? "")

  const approveRequest = useApproveRequest()
  const rejectRequest = useRejectRequest()
  const isActionPending = approveRequest.isPending || rejectRequest.isPending

  const employees = employeesData?.data ?? EMPTY_EMPLOYEES
  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  )

  const rows = useMemo(
    () =>
      (data?.data ?? EMPTY_APPROVALS).map((request) =>
        mapApprovalRequest(request, employeesById, { t, intlLocale })
      ),
    [data?.data, employeesById, t, intlLocale]
  )

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  )

  const selectedRequest = useMemo(
    () =>
      selectedDetail
        ? mapApprovalRequest(selectedDetail, employeesById, { t, intlLocale })
        : selectedRow,
    [employeesById, selectedDetail, selectedRow, t, intlLocale]
  )

  const liveStats = useMemo(
    () => ({
      pending:
        pendingForMe?.length ??
        rows.filter((r) => r.status === "PENDING").length,
      approvedThisMonth: rows.filter(
        (r) => r.status === "APPROVED" && isCurrentMonth(r.completedAt)
      ).length,
      rejectedThisMonth: rows.filter(
        (r) => r.status === "REJECTED" && isCurrentMonth(r.completedAt)
      ).length,
      avgResponseHours: averageResponseHours(rows),
    }),
    [pendingForMe, rows]
  )

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const submitted = dateKey(row.dateSubmitted)
      if (!submitted) return !fromDate && !toDate
      if (fromDate && submitted < fromDate) return false
      if (toDate && submitted > toDate) return false
      return true
    })
  }, [rows, fromDate, toDate])

  const handleApprove = (row: ApprovalRequest) => {
    approveRequest.mutate(
      { id: row.id, payload: { notes: "Approved from HR approvals inbox." } },
      {
        onSuccess: () => {
          toast.success(t("approvedToast", { number: row.requestNumber }))
          setSelectedId(null)
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          toast.error(t("approveFailed"), {
            description: apiErr.message ?? t("approveFailedDescription"),
          })
        },
      }
    )
  }

  const handleReject = (row: ApprovalRequest) => {
    setRejectTarget(row)
    setRejectReason("")
  }

  const submitReject = () => {
    if (!rejectTarget) return

    const reason = rejectReason.trim()
    if (!reason) {
      toast.error(t("rejectReasonRequired"), {
        description: t("rejectReasonRequiredDescription"),
      })
      return
    }

    rejectRequest.mutate(
      { id: rejectTarget.id, payload: { reason } },
      {
        onSuccess: () => {
          toast.success(t("rejectedToast", { number: rejectTarget.requestNumber }))
          setRejectTarget(null)
          setRejectReason("")
          setSelectedId(null)
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          toast.error(t("rejectFailed"), {
            description: apiErr.message ?? t("rejectFailedDescription"),
          })
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("statPending")}
          value={liveStats.pending}
          description={t("statPendingDescription")}
          tone="rose"
          icon={<Clock className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("statApprovedThisMonth")}
          value={liveStats.approvedThisMonth}
          description={t("statApprovedDescription")}
          tone="violet"
          icon={<Check className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("statRejectedThisMonth")}
          value={liveStats.rejectedThisMonth}
          description={t("statRejectedDescription")}
          tone="violet"
          icon={<X className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("statAvgResponseTime")}
          value={t("hoursShort", { hours: liveStats.avgResponseHours })}
          description={t("statAvgResponseDescription")}
          tone="violet"
          icon={<Timer className="size-4" strokeWidth={1.75} />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-stroke-default bg-surface-white px-5 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-content-secondary">
          <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          {t("filtersLabel")}
        </span>
        <Select
          value={typeFilter}
          onValueChange={(value) =>
            setTypeFilter(value as ApprovalRequestType | "ALL")
          }
        >
          <SelectTrigger className="h-9 w-[160px] rounded-[10px]">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((filter) => (
              <SelectItem key={filter} value={filter}>
                {filter === "ALL" ? t("allTypes") : t(`type.${filter}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as ApprovalRequestStatus | "ALL")
          }
        >
          <SelectTrigger className="h-9 w-[160px] rounded-[10px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((filter) => (
              <SelectItem key={filter} value={filter}>
                {filter === "ALL" ? t("allStatuses") : t(`status.${filter}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-2 text-sm text-content-tertiary">
          <Calendar className="size-4 shrink-0" strokeWidth={1.75} />
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-9 w-[150px] rounded-[10px] border-transparent bg-surface-page"
            aria-label={t("fromDate")}
          />
          <span>{t("dateRangeTo")}</span>
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-9 w-[150px] rounded-[10px] border-transparent bg-surface-page"
            aria-label={t("toDate")}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-stroke-default bg-surface-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6">{t("colRequestNumber")}</TableHead>
              <TableHead>{t("colType")}</TableHead>
              <TableHead>{t("colEmployee")}</TableHead>
              <TableHead>{t("requestedBy")}</TableHead>
              <TableHead>{t("colDateSubmitted")}</TableHead>
              <TableHead>{t("colDetailsSummary")}</TableHead>
              <TableHead>{t("colStatus")}</TableHead>
              <TableHead className="pe-6 text-end">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <ApprovalTableSkeleton />
          ) : (
            <TableBody>
              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-sm text-content-tertiary"
                  >
                    {t("loadError")}
                  </TableCell>
                </TableRow>
              )}

              {!isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-sm text-content-tertiary"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}

              {!isError &&
                filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-b border-stroke-default hover:bg-surface-hover/50"
                    tabIndex={0}
                    aria-label={t("openApproval", { number: row.requestNumber })}
                    onClick={() => setSelectedId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedId(row.id)
                      }
                    }}
                  >
                    <TableCell className="ps-6">
                      <span className="inline-flex items-center gap-0.5 font-mono text-sm font-medium text-content-primary">
                        {row.requestNumber}
                        <ChevronRight className="size-3.5 text-content-quaternary rtl:rotate-180" />
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium",
                          TYPE_BADGE_CLASS[row.type]
                        )}
                      >
                        {t(`type.${row.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar
                          size="sm"
                          alt={row.employeeName}
                          className={cn(
                            "font-semibold",
                            AVATAR_TONE_CLASSES[row.employeeAvatarTone]
                          )}
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-content-primary">
                            {row.employeeName}
                          </span>
                          <span className="font-mono text-xs text-content-tertiary">
                            {row.employeeNumber}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-content-secondary">
                      {row.requestedBy}
                    </TableCell>
                    <TableCell className="text-sm text-content-secondary">
                      {formatSubmitted(row.dateSubmitted, intlLocale)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-content-primary">
                      {row.detailsSummary}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium",
                          STATUS_BADGE_CLASS[row.status]
                        )}
                      >
                        {t(`status.${row.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-6 text-end">
                      {row.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-[10px] border-brand-success text-brand-success hover:bg-brand-success/5"
                            disabled={isActionPending}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleApprove(row)
                            }}
                          >
                            {tCommon("approve")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-[10px] border-brand-danger text-brand-danger hover:bg-brand-danger/5"
                            disabled={isActionPending}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleReject(row)
                            }}
                          >
                            {tCommon("reject")}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-content-quaternary">
                          -
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          )}
        </Table>
      </div>

      <ApprovalRequestDetailSheet
        request={selectedRequest}
        open={Boolean(selectedId)}
        onOpenChange={(next) => {
          if (!next) setSelectedId(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(next) => {
          if (!next) {
            setRejectTarget(null)
            setRejectReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? t("rejectDialogDescription", {
                    number: rejectTarget.requestNumber,
                  })
                : t("rejectDialogDescriptionFallback")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={t("reason")}
              maxLength={1000}
              autoFocus
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-[10px]"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason("")
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-[10px]"
              disabled={rejectRequest.isPending}
              onClick={submitReject}
            >
              {tCommon("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
