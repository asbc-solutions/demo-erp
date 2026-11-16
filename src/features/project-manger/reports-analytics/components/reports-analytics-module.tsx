"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { Card } from "@/src/shared/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"
import { Progress } from "@/src/shared/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ProgressColor } from "../../all-project/data/all-projects-data"
import { formatMoney } from "../../lib/mappers/cost-budget-mapper"
import { usePortfolioDashboard } from "../../lib/queries/reporting"

const KPI_LABELS: { key: keyof KpiPcts; label: string }[] = [
  { key: "on_time_delivery_pct", label: "On-Time Delivery" },
  { key: "budget_compliance_pct", label: "Budget Compliance" },
  { key: "resource_utilization_pct", label: "Resource Utilization" },
  { key: "scope_stability_pct", label: "Scope Stability" },
]

type KpiPcts = {
  on_time_delivery_pct: number
  budget_compliance_pct: number
  resource_utilization_pct: number
  scope_stability_pct: number
}

function pctColor(value: number): ProgressColor {
  if (value >= 85) return "emerald"
  if (value >= 70) return "amber"
  return "red"
}

const STATUS_COLOR: Record<string, ProgressColor> = {
  created: "violet",
  released: "indigo",
  technically_complete: "blue",
  closed: "emerald",
}

const trendConfig: ChartConfig = {
  active_count: { label: "Active", color: "var(--brand-primary)" },
  created_count: { label: "Created", color: "var(--brand-info)" },
  completed_count: { label: "Completed", color: "var(--brand-success)" },
}

export function ReportsAnalyticsModule() {
  const { data, isLoading, isError } = usePortfolioDashboard()

  const financials = useMemo(() => {
    const f = data?.financials
    return [
      { id: "budget", label: "Total Budget", value: formatMoney(f?.total_budget) },
      {
        id: "actual",
        label: "Actual Cost",
        value: formatMoney(f?.total_actual_cost),
      },
      {
        id: "invoiced",
        label: "Total Invoiced",
        value: formatMoney(f?.total_invoiced),
      },
    ]
  }, [data])

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
          Reports &amp; Analytics
        </h1>
        <p className="text-content-tertiary text-sm">
          Portfolio-wide delivery, financial, and utilization insights
          {data ? ` · ${data.total_projects} projects` : ""}
        </p>
      </header>

      {isLoading ? (
        <div className="bg-surface-muted h-[60vh] w-full animate-pulse rounded-[14px]" />
      ) : isError || !data ? (
        <Card className="flex h-48 items-center justify-center p-6">
          <p className="text-content-tertiary text-sm">
            Couldn&apos;t load portfolio analytics.
          </p>
        </Card>
      ) : (
        <>
          {/* KPI performance cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_LABELS.map(({ key, label }) => {
              const value = Math.round(data.kpis[key])
              return (
                <Card key={key} className="gap-2 p-4">
                  <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                    {label}
                  </span>
                  <span className="text-content-primary text-2xl leading-7 font-bold">
                    {value}%
                  </span>
                  <Progress
                    value={value}
                    color={pctColor(value)}
                    className="bg-surface-muted h-1.5"
                  />
                </Card>
              )
            })}
          </section>

          {/* trends + status */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="gap-4 p-5 lg:col-span-2">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-content-primary text-sm font-semibold">
                  Project Trends
                </h3>
                <p className="text-content-tertiary text-xs">
                  Created, active, and completed by month
                </p>
              </div>
              {data.trends.length === 0 ? (
                <p className="text-content-tertiary py-8 text-center text-sm">
                  Not enough history yet.
                </p>
              ) : (
                <ChartContainer
                  config={trendConfig}
                  className="aspect-auto h-[220px] w-full"
                >
                  <LineChart
                    data={data.trends}
                    margin={{ left: -12, right: 8, top: 8 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--stroke-light)" />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px]"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={28}
                      allowDecimals={false}
                      className="text-[10px]"
                    />
                    <Line
                      dataKey="active_count"
                      stroke="var(--color-active_count)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="created_count"
                      stroke="var(--color-created_count)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="completed_count"
                      stroke="var(--color-completed_count)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </Card>

            <Card className="gap-4 p-5">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-content-primary text-sm font-semibold">
                  By Status
                </h3>
                <p className="text-content-tertiary text-xs">
                  Share of the portfolio
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {data.by_status.map((row) => (
                  <div key={row.status} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-content-secondary font-medium">
                        {row.status_label}
                      </span>
                      <span className="text-content-tertiary tabular-nums">
                        {row.project_count} · {Math.round(row.share_pct)}%
                      </span>
                    </div>
                    <Progress
                      value={row.share_pct}
                      color={STATUS_COLOR[row.status] ?? "indigo"}
                      className="bg-surface-muted h-1.5"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* financials + by type */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="gap-4 p-5">
              <h3 className="text-content-primary text-sm font-semibold">
                Financials
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {financials.map((f) => (
                  <div
                    key={f.id}
                    className="bg-surface-muted flex flex-col gap-1 rounded-lg p-3"
                  >
                    <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                      {f.label}
                    </span>
                    <span className="text-content-primary text-lg font-bold">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="gap-4 p-5">
              <h3 className="text-content-primary text-sm font-semibold">
                By Type
              </h3>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Type</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead className="text-end">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_type.map((row) => (
                    <TableRow key={row.project_type}>
                      <TableCell className="text-content-primary text-[13px] font-medium">
                        {row.project_type_label}
                      </TableCell>
                      <TableCell className="text-content-secondary text-[13px] tabular-nums">
                        {row.project_count}
                      </TableCell>
                      <TableCell className="text-content-secondary text-[13px] tabular-nums">
                        {Math.round(row.share_pct)}%
                      </TableCell>
                      <TableCell className="text-content-primary text-end text-[13px] font-semibold tabular-nums">
                        {formatMoney(row.total_budget)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>

          {/* project financials table */}
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-0.5 px-5 pt-5 pb-3">
              <h3 className="text-content-primary text-sm font-semibold">
                Projects
              </h3>
              <p className="text-content-tertiary text-xs">
                Budget, cost, and invoicing by project
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Budget</TableHead>
                  <TableHead className="text-end">Actual Cost</TableHead>
                  <TableHead className="text-end">Invoiced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.projects.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="text-content-tertiary py-10 text-center text-sm"
                    >
                      No projects yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.projects.map((p) => {
                    const overBudget = p.actual_cost > p.budget_amount
                    return (
                      <TableRow key={p.project_id}>
                        <TableCell className="text-content-primary text-[13px] font-medium">
                          {p.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                              "bg-surface-muted text-content-secondary",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                p.status === "released"
                                  ? "bg-brand-primary"
                                  : p.status === "closed"
                                    ? "bg-brand-success"
                                    : "bg-content-tertiary",
                              )}
                            />
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-content-secondary text-end text-[13px] tabular-nums">
                          {formatMoney(p.budget_amount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-end text-[13px] font-semibold tabular-nums",
                            overBudget
                              ? "text-brand-danger"
                              : "text-content-primary",
                          )}
                        >
                          {formatMoney(p.actual_cost)}
                        </TableCell>
                        <TableCell className="text-content-secondary text-end text-[13px] tabular-nums">
                          {formatMoney(p.total_invoiced)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
