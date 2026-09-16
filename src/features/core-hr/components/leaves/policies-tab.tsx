"use client"

import { Info } from "lucide-react"

import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { useLeavePolicies, useLeaveTypes } from "../../lib/queries/leave"
import type { LeavePolicy, LeaveType } from "../../lib/types"
import {
  ACCRUAL_METHOD_LABELS,
  getLeaveCategoryStyle,
} from "../../lib/utils/leave-style"

const SCOPE_LABEL: Record<LeavePolicy["scope"], string> = {
  all: "Applies to all employees",
  grade: "Grade-specific policy",
  dept: "Department-specific policy",
}

type Metric = { label: string; value: string; hint?: string }

function buildMetrics(policy: LeavePolicy): Metric[] {
  const metrics: Metric[] = [
    {
      label: "Entitlement",
      value: `${policy.annual_entitlement_days} days`,
      hint: "per year",
    },
  ]

  if (policy.max_carry_forward_days && policy.max_carry_forward_days > 0) {
    metrics.push({
      label: "Max Carry-Over",
      value: `${policy.max_carry_forward_days} days`,
      hint: "into next year",
    })
  }

  metrics.push({
    label: "Accrual Method",
    value: ACCRUAL_METHOD_LABELS[policy.accrual_method],
    hint:
      policy.accrual_method === "monthly" && policy.accrual_rate
        ? `${policy.accrual_rate} days per month`
        : undefined,
  })

  if (policy.notice_days > 0) {
    metrics.push({
      label: "Notice Required",
      value: `${policy.notice_days} days`,
      hint: "advance notice",
    })
  }

  if (policy.min_service_months > 0) {
    metrics.push({
      label: "Min. Service",
      value: `${policy.min_service_months} months`,
      hint: "before eligible",
    })
  }

  if (policy.max_consecutive_days) {
    metrics.push({
      label: "Max Consecutive",
      value: `${policy.max_consecutive_days} days`,
      hint: "per request",
    })
  }

  return metrics
}

function buildNote(policy: LeavePolicy, type?: LeaveType): string {
  const parts: string[] = []
  if (policy.max_carry_forward_days && policy.max_carry_forward_days > 0) {
    parts.push(
      `Unused leave of up to ${policy.max_carry_forward_days} days can be carried over to the next year.`,
    )
  }
  if (type?.requires_document) {
    parts.push("A supporting document is required when requesting this leave.")
  }
  if (policy.gender_eligibility === "male") {
    parts.push("Available to male employees only.")
  } else if (policy.gender_eligibility === "female") {
    parts.push("Available to female employees only.")
  }
  if (policy.min_service_months > 0) {
    parts.push(
      `Employees become eligible after ${policy.min_service_months} months of service.`,
    )
  }
  if (type && type.is_paid === false) {
    parts.push("This leave is unpaid.")
  }
  if (parts.length === 0) {
    return "Refer to the employee handbook for full details of this policy."
  }
  return parts.slice(0, 2).join(" ")
}

function PolicyCard({
  policy,
  type,
}: Readonly<{ policy: LeavePolicy; type?: LeaveType }>) {
  const style = getLeaveCategoryStyle(type?.category)
  const metrics = buildMetrics(policy)
  const note = buildNote(policy, type)

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
            {type?.name ?? "Leave Policy"}
          </h3>
          <p className="text-sm text-content-tertiary">
            {SCOPE_LABEL[policy.scope]}
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
  const { data: policiesData, isLoading: policiesLoading } = useLeavePolicies({
    per_page: 100,
  })
  const { data: typesData } = useLeaveTypes({ per_page: 100 })

  const policies = (policiesData?.data ?? []).filter(
    (policy) => policy.is_active !== false,
  )
  const types = typesData?.data ?? []
  const typeMap = new Map(types.map((t) => [t.id, t]))
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
          No leave policies have been configured yet.
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
