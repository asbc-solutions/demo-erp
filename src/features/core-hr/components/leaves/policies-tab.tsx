"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"

import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { useLeavePolicies, useLeaveTypes } from "../../lib/queries/leave"
import type { LeavePolicy, LeaveType } from "../../lib/types"
import { getLeaveCategoryStyle } from "../../lib/utils/leave-style"

type LeavesTranslator = ReturnType<typeof useTranslations<"HrLeaves">>

type Metric = { label: string; value: string; hint?: string }

function buildMetrics(policy: LeavePolicy, t: LeavesTranslator): Metric[] {
  const metrics: Metric[] = [
    {
      label: t("policyEntitlement"),
      value: t("daysCount", { count: policy.annual_entitlement_days }),
      hint: t("perYear"),
    },
  ]

  if (policy.max_carry_forward_days && policy.max_carry_forward_days > 0) {
    metrics.push({
      label: t("policyMaxCarryOver"),
      value: t("daysCount", { count: policy.max_carry_forward_days }),
      hint: t("intoNextYear"),
    })
  }

  metrics.push({
    label: t("policyAccrualMethod"),
    value: t(`accrualMethod.${policy.accrual_method}`),
    hint:
      policy.accrual_method === "monthly" && policy.accrual_rate
        ? t("daysPerMonth", { count: policy.accrual_rate })
        : undefined,
  })

  if (policy.notice_days > 0) {
    metrics.push({
      label: t("policyNoticeRequired"),
      value: t("daysCount", { count: policy.notice_days }),
      hint: t("advanceNotice"),
    })
  }

  if (policy.min_service_months > 0) {
    metrics.push({
      label: t("policyMinService"),
      value: t("monthsCount", { count: policy.min_service_months }),
      hint: t("beforeEligible"),
    })
  }

  if (policy.max_consecutive_days) {
    metrics.push({
      label: t("policyMaxConsecutive"),
      value: t("daysCount", { count: policy.max_consecutive_days }),
      hint: t("perRequest"),
    })
  }

  return metrics
}

function buildNote(
  policy: LeavePolicy,
  t: LeavesTranslator,
  type?: LeaveType,
): string {
  const parts: string[] = []
  if (policy.max_carry_forward_days && policy.max_carry_forward_days > 0) {
    parts.push(
      t("noteCarryOver", { count: policy.max_carry_forward_days }),
    )
  }
  if (type?.requires_document) {
    parts.push(t("noteDocumentRequired"))
  }
  if (policy.gender_eligibility === "male") {
    parts.push(t("noteMaleOnly"))
  } else if (policy.gender_eligibility === "female") {
    parts.push(t("noteFemaleOnly"))
  }
  if (policy.min_service_months > 0) {
    parts.push(t("noteMinService", { count: policy.min_service_months }))
  }
  if (type && type.is_paid === false) {
    parts.push(t("noteUnpaid"))
  }
  if (parts.length === 0) {
    return t("noteHandbook")
  }
  return parts.slice(0, 2).join(" ")
}

function PolicyCard({
  policy,
  type,
}: Readonly<{ policy: LeavePolicy; type?: LeaveType }>) {
  const t = useTranslations("HrLeaves")
  const style = getLeaveCategoryStyle(type?.category)
  const metrics = buildMetrics(policy, t)
  const note = buildNote(policy, t, type)

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-[14px] border bg-surface-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]",
        style.borderClass,
      )}
    >
      {/* Header */}
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
            {type?.name ?? t("leavePolicyFallback")}
          </h3>
          <p className="text-sm text-content-tertiary">
            {t(`policyScope.${policy.scope}`)}
          </p>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col gap-0.5 rounded-[10px] bg-surface-page px-4 py-3"
          >
            <span className="text-xs text-content-tertiary">{metric.label}</span>
            <span className="text-lg font-bold leading-7 text-content-primary">
              {metric.value}
            </span>
            {metric.hint && (
              <span className="text-xs text-content-quaternary">
                {metric.hint}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Info note */}
      <div
        className={cn(
          "flex items-start gap-2 rounded-[10px] px-4 py-3 text-xs leading-5",
          style.noteClass,
        )}
      >
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>{note}</span>
      </div>
    </div>
  )
}

export function PoliciesTab() {
  const t = useTranslations("HrLeaves")
  const { data: policiesData, isLoading: policiesLoading } = useLeavePolicies({
    per_page: 100,
  })
  const { data: typesData } = useLeaveTypes({ per_page: 100 })

  const policies = (policiesData?.data ?? []).filter(
    (policy) => policy.is_active !== false,
  )
  const types = typesData?.data ?? []
  const typeMap = new Map(types.map((type) => [type.id, type]))
  const resolveType = (policy: LeavePolicy) =>
    policy.leave_type ?? typeMap.get(policy.leave_type_id)

  if (policiesLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-[14px]" />
        ))}
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[14px] border border-stroke-default bg-surface-white">
        <span className="text-sm text-content-tertiary">
          {t("noPolicies")}
        </span>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          type={resolveType(policy)}
        />
      ))}
    </div>
  )
}
