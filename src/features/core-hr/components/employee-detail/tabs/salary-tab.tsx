"use client"

import * as React from "react"
import {
  DollarSign,
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { cn } from "@/src/shared/lib/utils/utils"

import { useSalaryHistory } from "../../../lib/queries/salaries"
import {
  CHANGE_REASON_LABELS,
  CHANGE_TYPE_LABELS,
} from "../../../lib/schema/salary"
import type { SalaryRecord } from "../../../lib/types"
import { HrSectionSpinner } from "../../shared/hr-loading"
import { DetailField, SectionCard } from "../section-card"

type SalaryTabProps = Readonly<{
  employeeId: string
}>

type BadgeVariant = "success" | "danger" | "warning" | "primary"

type ChangeTypeConfig = Readonly<{
  icon: LucideIcon
  iconBg: string
  iconColor: string
  badge: BadgeVariant
}>

const CHANGE_TYPE_CONFIG: Record<string, ChangeTypeConfig> = {
  increase: {
    icon: TrendingUp,
    iconBg: "bg-brand-success/10",
    iconColor: "text-brand-success",
    badge: "success",
  },
  decrease: {
    icon: TrendingDown,
    iconBg: "bg-brand-danger/10",
    iconColor: "text-brand-danger",
    badge: "danger",
  },
  correction: {
    icon: Minus,
    iconBg: "bg-brand-warning/10",
    iconColor: "text-brand-warning",
    badge: "warning",
  },
}

const DEFAULT_TYPE_CONFIG: ChangeTypeConfig = {
  icon: DollarSign,
  iconBg: "bg-brand-primary/10",
  iconColor: "text-brand-primary",
  badge: "primary",
}

function typeConfig(type: string | null): ChangeTypeConfig {
  return (type && CHANGE_TYPE_CONFIG[type]) || DEFAULT_TYPE_CONFIG
}

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function reasonLabel(reason: string | null) {
  if (!reason) return null
  return (
    CHANGE_REASON_LABELS[reason as keyof typeof CHANGE_REASON_LABELS] ??
    humanize(reason)
  )
}

function typeLabel(type: string | null) {
  if (!type) return null
  return (
    CHANGE_TYPE_LABELS[type as keyof typeof CHANGE_TYPE_LABELS] ??
    humanize(type)
  )
}

function dateFromIso(iso: string | null | undefined) {
  if (!iso) return null
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(iso: string | null | undefined) {
  const date = dateFromIso(iso)
  if (!date) return iso ?? "—"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatMoney(value: number | null | undefined, currency = "EGP") {
  if (value == null || !Number.isFinite(value)) return "—"
  return `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

type MoneyTileProps = Readonly<{
  label: string
  value: string
  tone: "indigo" | "emerald"
}>

function MoneyTile({ label, value, tone }: MoneyTileProps) {
  return (
    <div className="border-stroke-default bg-surface-page flex items-start justify-between gap-4 rounded-[12px] border px-5 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
          {label}
        </span>
        <span className="text-content-primary text-2xl leading-8 font-semibold">
          {value}
        </span>
      </div>
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
          tone === "indigo" && "bg-brand-primary/10 text-brand-primary",
          tone === "emerald" && "bg-brand-success/10 text-brand-success"
        )}
      >
        <DollarSign className="size-4" strokeWidth={1.75} />
      </span>
    </div>
  )
}

function CurrentCompensationCard({
  salary,
}: Readonly<{ salary: SalaryRecord }>) {
  const currency = salary.currency_code || "EGP"
  const allowances = (
    [
      ["Housing", salary.housing_allowance],
      ["Transport", salary.transport_allowance],
      ["Food", salary.food_allowance],
      ["Mobile", salary.mobile_allowance],
      ["Other", salary.other_allowance],
    ] as const
  ).filter(([, amount]) => amount > 0)

  return (
    <SectionCard
      title="Current Compensation"
      description={`Effective ${formatDate(salary.effective_date)}`}
      action={
        salary.is_current ? (
          <Badge variant="success" className="rounded-full px-2.5">
            Active
          </Badge>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoneyTile
          label="Gross Monthly"
          value={formatMoney(salary.gross_salary, currency)}
          tone="indigo"
        />
        <MoneyTile
          label="Net Monthly"
          value={formatMoney(salary.net_salary, currency)}
          tone="emerald"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
        <DetailField
          label="Basic Salary"
          value={formatMoney(salary.basic_salary, currency)}
        />
        {allowances.map(([label, amount]) => (
          <DetailField
            key={label}
            label={`${label} Allowance`}
            value={formatMoney(amount, currency)}
          />
        ))}
        <DetailField label="Pay Frequency" value={salary.pay_frequency_label} />
      </div>
    </SectionCard>
  )
}

function CompensationHistoryCard({
  records,
}: Readonly<{ records: SalaryRecord[] }>) {
  return (
    <SectionCard
      title="Compensation History"
      description="Salary changes over time"
      bodyClassName="px-6 pb-6 pt-1"
    >
      {records.length === 0 ? (
        <p className="text-content-tertiary py-8 text-center text-sm">
          No compensation changes recorded yet.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-3 pl-2">
          {records.map((record, index) => {
            const isLast = index === records.length - 1
            const config = typeConfig(record.change_type)
            const Icon = config.icon
            const currency = record.currency_code || "EGP"
            const reason = reasonLabel(record.change_reason)
            const type = typeLabel(record.change_type)
            return (
              <li key={record.id} className="relative flex items-start gap-4">
                {!isLast && (
                  <span
                    aria-hidden
                    className="bg-stroke-default absolute top-9 left-3.75 h-[calc(100%-12px)] w-px"
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                    config.iconBg,
                    config.iconColor
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <article className="bg-surface-page border-stroke-default flex flex-1 flex-col gap-2 rounded-[12px] border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-content-primary text-sm leading-5 font-semibold">
                      {formatDate(record.effective_date)}
                    </span>
                    {type && <Badge variant={config.badge}>{type}</Badge>}
                    {record.is_current && (
                      <Badge variant="neutral">Current</Badge>
                    )}
                    <span className="text-content-primary ml-auto text-sm font-semibold">
                      {formatMoney(record.basic_salary, currency)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {reason && (
                      <span className="text-content-tertiary text-xs leading-4">
                        {reason}
                      </span>
                    )}
                    <span className="text-content-tertiary text-xs leading-4">
                      Gross {formatMoney(record.gross_salary, currency)} · Net{" "}
                      {formatMoney(record.net_salary, currency)}
                    </span>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </SectionCard>
  )
}

export function SalaryTab({ employeeId }: SalaryTabProps) {
  const { data, isLoading } = useSalaryHistory(employeeId)

  const history = React.useMemo(() => data?.history ?? [], [data?.history])
  // Some API responses contain the active record in `history` while leaving
  // `current` null. The history contract includes the current record, so use
  // its explicit flag as a safe fallback.
  const current =
    data?.current ?? history.find((record) => record.is_current) ?? null

  // Merge current + history, de-duplicate by id, and sort newest-first so the
  // timeline is correct whether or not the API includes the current record in
  // the history array.
  const timeline = React.useMemo(() => {
    const byId = new Map<string, SalaryRecord>()
    if (current) byId.set(current.id, current)
    for (const record of history) byId.set(record.id, record)
    return [...byId.values()].sort((a, b) => {
      const aTime = dateFromIso(a.effective_date)?.getTime() ?? 0
      const bTime = dateFromIso(b.effective_date)?.getTime() ?? 0
      return bTime - aTime
    })
  }, [current, history])

  if (isLoading) {
    return (
      <SectionCard title="Salary Information" description="Compensation history">
        <HrSectionSpinner />
      </SectionCard>
    )
  }

  if (!current && timeline.length === 0) {
    return (
      <SectionCard title="Salary Information" description="Compensation history">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="bg-surface-hover text-content-tertiary flex size-10 items-center justify-center rounded-full">
            <DollarSign className="size-5" strokeWidth={1.5} />
          </span>
          <p className="text-content-tertiary text-sm leading-5">
            No salary on record for this employee yet. Add one from the{" "}
            <span className="text-content-primary font-medium">Salaries</span>{" "}
            tab.
          </p>
        </div>
      </SectionCard>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {current && <CurrentCompensationCard salary={current} />}
      <CompensationHistoryCard records={timeline} />
    </div>
  )
}
