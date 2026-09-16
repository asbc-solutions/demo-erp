"use client"

import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Send,
  UserPlus,
} from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { useSalesDashboard } from "../../lib/queries/dashboard"
import { formatCurrency } from "../../lib/utils/currency"
import { formatRelativeTime } from "../../lib/utils/relative-time"
import type {
  DashboardKpi,
  PipelineStage,
  PipelineStageStatus,
  RecentActivity,
} from "../../lib/types"
import { SalesErrorState } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"

type KpiFormat = "currency" | "percent" | "number"

// Only 2 of the documented 8 kpis[].key values are confirmed by the Bruno
// docs (docs/sales.md §4.1) — everything else falls back to a humanized
// label/rail so unknown keys still render sensibly instead of being dropped.
const KPI_META: Record<string, { label: string; format: KpiFormat; rail: string }> = {
  total_sales: { label: "Total Sales", format: "currency", rail: "bg-brand-primary" },
  quotation_conversion_rate: {
    label: "Quotation Conversion Rate",
    format: "percent",
    rail: "bg-teal-500",
  },
}
const FALLBACK_RAILS = [
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-red-500",
  "bg-pink-500",
]

const STAGE_META: Record<PipelineStageStatus, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-indigo-600" },
  sent: { label: "Sent", tone: "bg-indigo-500" },
  accepted: { label: "Accepted", tone: "bg-teal-500" },
  converted: { label: "Converted", tone: "bg-emerald-500" },
}

function humanize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatKpiValue(value: number, format: KpiFormat) {
  if (format === "currency") return formatCurrency(value)
  if (format === "percent") return `${value}%`
  return value.toLocaleString()
}

function activityVisual(type: string) {
  if (type.includes("invoice")) {
    return { icon: FileText, tone: "bg-violet-100 text-violet-600" }
  }
  if (type.includes("payment")) {
    return { icon: ArrowUpRight, tone: "bg-teal-100 text-teal-600" }
  }
  if (type.includes("order")) {
    return { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-600" }
  }
  if (type.includes("quotation")) {
    return { icon: Send, tone: "bg-blue-100 text-blue-600" }
  }
  if (type.includes("customer")) {
    return { icon: UserPlus, tone: "bg-pink-100 text-pink-600" }
  }
  return { icon: FileText, tone: "bg-surface-hover text-content-tertiary" }
}

function withBarWidths<T extends { total_amount: number }>(items: T[]) {
  const max = Math.max(...items.map((item) => item.total_amount), 1)
  return items.map((item) => ({
    ...item,
    widthPct: Math.max(4, Math.round((item.total_amount / max) * 100)),
  }))
}

function MetricCard({ kpi, rail }: { kpi: DashboardKpi; rail: string }) {
  const meta = KPI_META[kpi.key]
  const format = meta?.format ?? "number"
  const label = meta?.label ?? humanize(kpi.key)
  const isUp = (kpi.delta_pct ?? 0) >= 0

  return (
    <article className="relative overflow-hidden rounded-2xl border border-stroke-default bg-surface-white px-5 py-4 shadow-xs">
      <span className={cn("absolute inset-x-0 top-0 h-1", rail)} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-content-tertiary">
          {label}
        </p>
        {kpi.delta_pct != null ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-100 text-red-500",
            )}
          >
            {isUp ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(kpi.delta_pct).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-content-primary">
        {formatKpiValue(kpi.value, format)}
      </p>
      <p className="mt-1 text-[11px] text-content-quaternary">vs prior period</p>
    </article>
  )
}

function RankingCard({
  title,
  href,
  children,
}: Readonly<{
  title: string
  href: string
  children: React.ReactNode
}>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-xs">
      <header className="flex items-center justify-between border-b border-stroke-light px-5 py-4">
        <h2 className="text-sm font-semibold text-content-primary">{title}</h2>
        <Link href={href} className="text-xs font-medium text-brand-primary hover:opacity-80">
          View all →
        </Link>
      </header>
      <div className="divide-y divide-stroke-light px-5">{children}</div>
    </section>
  )
}

function PipelineFunnel({ stages }: Readonly<{ stages: PipelineStage[] }>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-xs">
      <header className="flex items-center justify-between border-b border-stroke-light px-5 py-4">
        <h2 className="text-sm font-semibold text-content-primary">Pipeline Funnel</h2>
      </header>
      <div className="space-y-4 px-5 py-5">
        {stages.map((stage) => {
          const meta = STAGE_META[stage.status]
          return (
            <div
              key={stage.status}
              className="grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-4"
            >
              <span className="text-xs font-medium text-content-secondary">
                {meta?.label ?? humanize(stage.status)}
              </span>
              <div
                className={cn(
                  "flex h-9 items-center rounded-lg px-3",
                  meta?.tone ?? "bg-content-quaternary",
                )}
              >
                <span className="ml-auto text-xs font-semibold text-white">
                  {stage.count}
                </span>
              </div>
              <span className="text-right text-[11px] text-content-quaternary">
                {stage.advance_pct != null ? `${stage.advance_pct}% →` : "—"}
              </span>
            </div>
          )
        })}
        <p className="pt-1 text-[11px] text-content-quaternary">
          Conversion % shows the share advancing to the next stage.
        </p>
      </div>
    </div>
  )
}

function RecentActivityCard({ activities }: Readonly<{ activities: RecentActivity[] }>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-xs">
      <header className="border-b border-stroke-light px-5 py-4">
        <h2 className="text-sm font-semibold text-content-primary">Recent Activity</h2>
      </header>
      <div className="max-h-[330px] divide-y divide-stroke-light overflow-y-auto">
        {activities.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-content-tertiary">
            No recent activity.
          </p>
        ) : (
          activities.map((activity, index) => {
            const { icon: Icon, tone } = activityVisual(activity.type)
            return (
              <article
                key={`${activity.ref_id}-${index}`}
                className="flex gap-3 px-5 py-3.5"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                    tone,
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium leading-5 text-content-primary">
                      {humanize(activity.type)}
                    </p>
                    <span className="shrink-0 text-[10px] text-content-quaternary">
                      {formatRelativeTime(activity.occurred_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 text-content-tertiary">
                    Ref: {activity.ref_number}
                  </p>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export function SalesDashboard() {
  const { data, isLoading, isError, refetch } = useSalesDashboard()

  if (isLoading) return <SalesPageSpinner />

  if (isError || !data) {
    return <SalesErrorState message="Failed to load the sales dashboard." onRetry={() => void refetch()} />
  }

  const topCustomers = withBarWidths(data.top_customers)
  const topProducts = withBarWidths(
    data.top_products.map((p) => ({ ...p, total_amount: p.total_amount })),
  )

  return (
    <div className="flex flex-1 flex-col gap-6 bg-surface-page p-4 sm:p-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <MetricCard
            key={kpi.key}
            kpi={kpi}
            rail={KPI_META[kpi.key]?.rail ?? FALLBACK_RAILS[index % FALLBACK_RAILS.length]}
          />
        ))}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <PipelineFunnel stages={data.pipeline_funnel.stages} />
        <RecentActivityCard activities={data.recent_activity} />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <RankingCard title="Top Customers" href="/sales/customers">
          {topCustomers.length === 0 ? (
            <p className="py-6 text-center text-xs text-content-tertiary">No data yet.</p>
          ) : (
            topCustomers.map((customer, index) => (
              <div
                key={customer.customer_id}
                className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 py-3"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-surface-hover text-[11px] font-medium text-content-tertiary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-content-primary">
                    {customer.customer_name}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${customer.widthPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-content-primary">
                  {formatCurrency(customer.total_amount)}
                </span>
              </div>
            ))
          )}
        </RankingCard>

        <RankingCard title="Top Products" href="/sales/sales-orders">
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-xs text-content-tertiary">No data yet.</p>
          ) : (
            topProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 py-3"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-surface-hover text-[11px] font-medium text-content-tertiary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-content-primary">
                    {product.product_name}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${product.widthPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-content-primary">
                  {formatCurrency(product.total_amount)}
                </span>
              </div>
            ))
          )}
        </RankingCard>
      </section>
    </div>
  )
}
