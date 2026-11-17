"use client"

import { useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  HeartPulse,
  Plus,
  Scale,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { ApiError } from "@/src/shared/lib/types/api"
import { Button } from "@/src/shared/components/ui/button"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/ui/tabs"
import { cn } from "@/src/shared/lib/utils/utils"

import { useCancelLeaveRequest } from "../../lib/mutations/leave"
import {
  useLeaveTypes,
  useMyLeaveBalances,
  useMyLeaveRequests,
} from "../../lib/queries/leave"
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from "../../lib/types"
import { formatLeaveDate, formatLeaveRange } from "../../lib/utils/leave-format"
import {
  getLeaveCategoryStyle,
  LEAVE_REQUEST_STATUS_CONFIG,
} from "../../lib/utils/leave-style"

import { ApplyLeaveDialog } from "./apply-leave-dialog"
import { PoliciesTab } from "./policies-tab"

const CARD_SHADOW =
  "shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"

function isEmployeeProfileMissing(error: unknown) {
  if (!error || typeof error !== "object") return false

  const apiError = error as Partial<ApiError>
  // `/leave/balances/me` returns 404 only when the signed-in user has no linked
  // employee record, so treat any NOT_FOUND as the "profile not linked" case
  // rather than matching a localized message string.
  return apiError.code === "NOT_FOUND" || apiError.code === "404"
}

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueClass,
  Icon,
  iconClass,
  caption,
  progress,
}: Readonly<{
  label: string
  value: string
  valueClass?: string
  Icon: React.ElementType
  iconClass: string
  caption?: { left: string; right: string }
  progress?: number
}>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[14px] border border-stroke-default bg-surface-white p-6",
        CARD_SHADOW,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-content-tertiary">{label}</span>
          <span
            className={cn(
              "text-2xl font-bold leading-8 tabular-nums text-content-primary",
              valueClass,
            )}
          >
            {value}
          </span>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
            iconClass,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      {caption && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-content-tertiary">
            <span>{caption.left}</span>
            <span className="tabular-nums">{caption.right}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-stroke-light">
            <div
              className="absolute inset-y-0 inset-s-0 rounded-full bg-brand-primary"
              style={{ width: `${Math.min(Math.max(progress ?? 0, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Annual balance hero card ─────────────────────────────────────────────────

function AnnualBalanceCard({
  balance,
  type,
}: Readonly<{ balance: LeaveBalance; type?: LeaveType }>) {
  const t = useTranslations("HrLeaves")
  const style = getLeaveCategoryStyle(type?.category ?? "annual")
  const total = balance.opening_balance + balance.accrued_ytd
  const available = balance.available_balance
  const remainingPct = total > 0 ? Math.round((available / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6 rounded-[14px] border border-brand-success/30 bg-gradient-to-br from-brand-success/[0.06] to-transparent p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
              style.iconClass,
            )}
          >
            <style.Icon className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-content-primary">
              {t("balanceTitle", { name: type?.name ?? t("annualLeave") })}
            </h3>
            <p className="text-sm text-content-tertiary">
              {t("balanceSubtitle")}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p
            className={cn(
              "text-3xl font-bold leading-9 tabular-nums",
              style.accentText,
            )}
          >
            {available}
          </p>
          <p className="text-sm text-content-tertiary">
            {t("daysAvailable")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-content-secondary">
          <span>{t("daysUsed", { count: balance.used_ytd })}</span>
          <span>{t("daysPending", { count: balance.pending_ytd })}</span>
          <span>{t("totalEntitlement", { count: total })}</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-stroke-light">
          <div
            className="absolute inset-y-0 inset-s-0 rounded-full bg-brand-primary"
            style={{ width: `${Math.min(Math.max(remainingPct, 0), 100)}%` }}
          />
        </div>
        <p className="text-end text-xs text-content-tertiary">
          {t("percentRemaining", { percent: remainingPct })}
        </p>
      </div>
    </div>
  )
}

// ─── Requests table ───────────────────────────────────────────────────────────

function RequestsTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="ps-6">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="size-7 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="pe-6">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell />
        </TableRow>
      ))}
    </TableBody>
  )
}

function RequestRow({
  request,
  type,
  onCancel,
  cancelling,
}: Readonly<{
  request: LeaveRequest
  type?: LeaveType
  onCancel: (id: string) => void
  cancelling: boolean
}>) {
  const t = useTranslations("HrLeaves")
  const style = getLeaveCategoryStyle(type?.category)
  const statusKey: LeaveRequestStatus =
    request.status in LEAVE_REQUEST_STATUS_CONFIG ? request.status : "pending"
  const status = LEAVE_REQUEST_STATUS_CONFIG[statusKey]
  const canCancel =
    request.can_be_cancelled ??
    (request.status === "pending" || request.status === "draft")

  return (
    <TableRow className="border-b border-stroke-default hover:bg-surface-hover/50">
      <TableCell className="ps-6">
        <span className="inline-flex items-center gap-2 text-sm text-content-primary">
          <span className={cn("size-2.5 shrink-0 rounded-full", style.dotClass)} />
          {type?.name ?? t("leaveFallback")}
        </span>
      </TableCell>
      <TableCell className="text-sm text-content-secondary">
        {formatLeaveRange(request.start_date, request.end_date)}
      </TableCell>
      <TableCell>
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-surface-hover text-xs font-medium tabular-nums text-content-primary">
          {request.working_days}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
            status.className,
          )}
        >
          <span className={cn("size-1.5 rounded-full", status.dotClass)} />
          {t(`requestStatus.${statusKey}`)}
        </span>
      </TableCell>
      <TableCell className="pe-6 text-sm text-content-tertiary">
        {formatLeaveDate(request.submitted_at ?? request.created_at)}
      </TableCell>
      <TableCell className="pe-4 text-end">
        {canCancel ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-content-tertiary hover:text-brand-danger"
            disabled={cancelling}
            onClick={() => onCancel(request.id)}
            aria-label={t("cancelRequest")}
          >
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function MyLeaveView() {
  const t = useTranslations("HrLeaves")
  const [applyOpen, setApplyOpen] = useState(false)
  const year = new Date().getFullYear()

  const {
    data: balancesData,
    error: balancesError,
    isError: balancesIsError,
    isLoading: balancesLoading,
  } = useMyLeaveBalances({ year })
  const { data: typesData } = useLeaveTypes({ per_page: 100 })
  const employeeProfileMissing = isEmployeeProfileMissing(balancesError)
  const {
    data: requestsData,
    error: requestsError,
    isError: requestsIsError,
    isLoading: requestsLoading,
  } = useMyLeaveRequests(
    {
      year,
      per_page: 50,
    },
    { enabled: !balancesLoading && !balancesIsError },
  )
  const cancelRequest = useCancelLeaveRequest()

  const balances = balancesData ?? []
  const types = typesData?.data ?? []
  const typeMap = new Map(types.map((type) => [type.id, type]))
  const resolveType = (leaveTypeId: string, embedded?: LeaveType) =>
    embedded ?? typeMap.get(leaveTypeId)

  const requests = requestsData?.data ?? []

  const findBalanceByCategory = (category: string) =>
    balances.find(
      (b) => resolveType(b.leave_type_id, b.leave_type)?.category === category,
    )

  const annualBalance = findBalanceByCategory("annual")
  const sickBalance = findBalanceByCategory("sick")
  const annualType = annualBalance
    ? resolveType(annualBalance.leave_type_id, annualBalance.leave_type)
    : undefined

  const annualTotal = annualBalance
    ? annualBalance.opening_balance + annualBalance.accrued_ytd
    : 0
  const annualAvailable = annualBalance?.available_balance ?? 0
  const annualPct =
    annualTotal > 0 ? Math.round((annualAvailable / annualTotal) * 100) : 0

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const approvedCount = requests.filter((r) => r.status === "approved").length
  const balanceLeaveTypes = balances
    .map((balance) => resolveType(balance.leave_type_id, balance.leave_type))
    .filter((type): type is LeaveType => Boolean(type))
  const balanceLeaveTypeIds = balances.map((balance) => balance.leave_type_id)

  const handleCancel = (id: string) => {
    cancelRequest.mutate(id, {
      onSuccess: () => toast.success(t("requestCancelled")),
      onError: (err) => {
        const apiError = err as unknown as ApiError
        toast.error(t("cancelFailed"), {
          description: apiError.message ?? t("cancelNoLongerPossible"),
        })
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {balancesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-[14px]" />
          ))
        ) : employeeProfileMissing ? (
          <div className="flex min-h-32 flex-col justify-center gap-2 rounded-[14px] border border-brand-warning/30 bg-brand-warning/[0.06] p-6 sm:col-span-2 xl:col-span-4">
            <h3 className="text-base font-semibold text-content-primary">
              {t("profileNotLinkedTitle")}
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-content-tertiary">
              {t("profileNotLinkedBody")}
            </p>
          </div>
        ) : balancesIsError ? (
          <div className="flex min-h-32 items-center justify-center rounded-[14px] border border-stroke-default bg-surface-white p-6 text-center sm:col-span-2 xl:col-span-4">
            <span className="text-sm text-content-tertiary">
              {t("balancesLoadError", {
                detail:
                  (balancesError as Partial<ApiError>)?.message ??
                  t("pleaseTryAgain"),
              })}
            </span>
          </div>
        ) : (
          <>
            <StatCard
              label={t("statAnnualAvailable")}
              value={t("daysCount", { count: annualAvailable })}
              valueClass="text-brand-success"
              Icon={CalendarDays}
              iconClass="bg-brand-success/10 text-brand-success"
              caption={{
                left: t("daysOfTotal", {
                  available: annualAvailable,
                  total: annualTotal,
                }),
                right: t("percent", { percent: annualPct }),
              }}
              progress={annualPct}
            />
            <StatCard
              label={t("statSickUsed")}
              value={t("daysCount", { count: sickBalance?.used_ytd ?? 0 })}
              valueClass="text-brand-warning"
              Icon={HeartPulse}
              iconClass="bg-brand-warning/10 text-brand-warning"
            />
            <StatCard
              label={t("statPendingRequests")}
              value={String(pendingCount)}
              Icon={Clock}
              iconClass="bg-brand-info/10 text-brand-info"
            />
            <StatCard
              label={t("statApprovedThisYear")}
              value={String(approvedCount)}
              Icon={CheckCircle2}
              iconClass="bg-brand-primary/10 text-brand-primary"
            />
          </>
        )}
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="requests" variant="pill" className="gap-6">
        <TabsList>
          <TabsTrigger value="requests">
            <Clock className="size-4" strokeWidth={1.75} />
            {t("tabMyRequests")}
          </TabsTrigger>
          <TabsTrigger value="policies">
            <Scale className="size-4" strokeWidth={1.75} />
            {t("tabPolicies")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="flex flex-col gap-6">
          {/* Annual balance hero */}
          {balancesLoading ? (
            <Skeleton className="h-[200px] rounded-[14px]" />
          ) : annualBalance ? (
            <AnnualBalanceCard balance={annualBalance} type={annualType} />
          ) : null}

          {/* Requests header */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-content-primary">
              {t("myLeaveRequests")}
            </h3>
            <Button
              variant="primary"
              className="h-9 gap-1.5 rounded-[10px]"
              disabled={employeeProfileMissing || balancesIsError}
              onClick={() => setApplyOpen(true)}
            >
              <Plus className="size-4" strokeWidth={2} />
              {t("applyForLeave")}
            </Button>
          </div>

          {/* Requests table */}
          <div className="overflow-hidden rounded-[14px] border border-stroke-default bg-surface-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-6">{t("colType")}</TableHead>
                  <TableHead>{t("colDates")}</TableHead>
                  <TableHead>{t("colDays")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead className="pe-6">{t("colSubmitted")}</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              {requestsLoading ? (
                <RequestsTableSkeleton />
              ) : (
                <TableBody>
                  {employeeProfileMissing ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-sm text-content-tertiary"
                      >
                        {t("requestsProfileMissing")}
                      </TableCell>
                    </TableRow>
                  ) : balancesIsError ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-sm text-content-tertiary"
                      >
                        {t("requestsUnavailable")}
                      </TableCell>
                    </TableRow>
                  ) : requestsIsError ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-sm text-content-tertiary"
                      >
                        {t("requestsLoadError", {
                          detail:
                            (requestsError as Partial<ApiError>)?.message ??
                            t("pleaseTryAgain"),
                        })}
                      </TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-sm text-content-tertiary"
                      >
                        {t("requestsEmpty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <RequestRow
                        key={request.id}
                        request={request}
                        type={resolveType(
                          request.leave_type_id,
                          request.leave_type,
                        )}
                        onCancel={handleCancel}
                        cancelling={cancelRequest.isPending}
                      />
                    ))
                  )}
                </TableBody>
              )}
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="policies">
          <PoliciesTab />
        </TabsContent>
      </Tabs>

      <ApplyLeaveDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        fallbackLeaveTypeIds={balanceLeaveTypeIds}
        fallbackLeaveTypes={balanceLeaveTypes}
      />
    </div>
  )
}
