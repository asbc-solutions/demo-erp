"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
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

const KPI_LABELS = [
  { key: "on_time_delivery_pct", labelKey: "kpiOnTimeDelivery" },
  { key: "budget_compliance_pct", labelKey: "kpiBudgetCompliance" },
  { key: "resource_utilization_pct", labelKey: "kpiResourceUtilization" },
  { key: "scope_stability_pct", labelKey: "kpiScopeStability" },
] as const satisfies readonly { key: keyof KpiPcts; labelKey: string }[]

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

const PROJECT_STATUSES = [
  "created",
  "released",
  "technically_complete",
  "closed",
] as const
type ProjectStatusKey = (typeof PROJECT_STATUSES)[number]

function isProjectStatus(value: string): value is ProjectStatusKey {
  return PROJECT_STATUSES.includes(value as ProjectStatusKey)
}

export function ReportsAnalyticsModule() {
  const t = useTranslations("ProjectsReportsAnalytics")
  const tCommon = useTranslations("Common")
  const { data, isLoading, isError } = usePortfolioDashboard()

  const trendConfig = useMemo<ChartConfig>(
    () => ({
      active_count: { label: t("trendActive"), color: "var(--brand-primary)" },
      created_count: { label: t("trendCreated"), color: "var(--brand-info)" },
      completed_count: {
        label: t("trendCompleted"),
        color: "var(--brand-success)",
      },
    }),
    [t],
  )

  const financials = useMemo(() => {
    const f = data?.financials
    return [
      {
        id: "budget",
        label: t("totalBudget"),
        value: formatMoney(f?.total_budget),
      },
      {
        id: "actual",
        label: t("actualCost"),
        value: formatMoney(f?.total_actual_cost),
      },
      {
        id: "invoiced",
        label: t("totalInvoiced"),
        value: formatMoney(f?.total_invoiced),
      },
    ]
  }, [data, t])

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-content-tertiary text-sm">
          {data
            ? t("subtitleWithCount", { count: data.total_projects })
            : t("subtitle")}
        </p>
      </header>

      {isLoading ? (
        <div className="bg-surface-muted h-[60vh] w-full animate-pulse rounded-[14px]" />
      ) : isError || !data ? (
        <Card className="flex h-48 items-center justify-center p-6">
          <p className="text-content-tertiary text-sm">
            {t("loadError")}
          </p>
        </Card>
      ) : (
        <>
          {/* KPI performance cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_LABELS.map(({ key, labelKey }) => {
              const value = Math.round(data.kpis[key])
              return (
                <Card key={key} className="gap-2 p-4">
                  <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                    {t(labelKey)}
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
                  {t("trendsTitle")}
                </h3>
                <p className="text-content-tertiary text-xs">
                  {t("trendsSubtitle")}
                </p>
              </div>
              {data.trends.length === 0 ? (
                <p className="text-content-tertiary py-8 text-center text-sm">
                  {t("trendsEmpty")}
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
                  {t("byStatus")}
                </h3>
                <p className="text-content-tertiary text-xs">
                  {t("byStatusSubtitle")}
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
                {t("financials")}
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
                {t("byType")}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{tCommon("type")}</TableHead>
                    <TableHead>{t("colProjects")}</TableHead>
                    <TableHead>{t("colShare")}</TableHead>
                    <TableHead className="text-end">{t("colBudget")}</TableHead>
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
                {t("colProjects")}
              </h3>
              <p className="text-content-tertiary text-xs">
                {t("projectsSubtitle")}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("colProject")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead className="text-end">{t("colBudget")}</TableHead>
                  <TableHead className="text-end">{t("actualCost")}</TableHead>
                  <TableHead className="text-end">{t("colInvoiced")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.projects.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="text-content-tertiary py-10 text-center text-sm"
                    >
                      {t("noProjects")}
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
                            {isProjectStatus(p.status)
                              ? t(`projectStatus.${p.status}`)
                              : p.status}
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
