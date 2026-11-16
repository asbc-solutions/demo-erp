"use client"

import { useMemo } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { Card } from "@/src/shared/components/ui/card"
import { ChartContainer } from "@/src/shared/components/ui/chart"
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

import {
  buildCostDetail,
  buildCostMixSlices,
  buildWaterfallBars,
  evmMetricCards,
  formatMoney,
  humanizeLabel,
  type BudgetCostRow,
  type EvmMetricCard,
} from "../../lib/mappers/cost-budget-mapper"
import {
  useBudgetDashboard,
  useCostMix,
  useWaterfall,
} from "../../lib/queries/cost-budget"

const VALUE_TONE: Record<EvmMetricCard["tone"], string> = {
  default: "text-content-primary",
  warning: "text-brand-warning",
  danger: "text-brand-danger",
}

const VARIANCE_TONE: Record<BudgetCostRow["varianceTone"], string> = {
  danger: "text-brand-danger",
  success: "text-brand-success",
  neutral: "text-content-tertiary",
}

export function BudgetCostsModule() {
  // Omit project_id everywhere → portfolio-wide roll-up.
  const dashboard = useBudgetDashboard()
  const costMix = useCostMix()
  const waterfall = useWaterfall()

  const evmCards = useMemo(
    () => (dashboard.data ? evmMetricCards(dashboard.data.evm) : []),
    [dashboard.data],
  )
  const mix = useMemo(
    () => buildCostMixSlices(costMix.data?.items),
    [costMix.data],
  )
  const bars = useMemo(
    () => buildWaterfallBars(waterfall.data?.items),
    [waterfall.data],
  )
  const costDetail = useMemo(
    () => buildCostDetail(waterfall.data?.items),
    [waterfall.data],
  )

  const forecast = dashboard.data?.forecast
  const evm = dashboard.data?.evm
  const varianceNegative = (forecast?.variance_amount ?? 0) > 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            Budget &amp; Costs
          </h1>
          <p className="text-content-tertiary text-sm">
            Earned-value, cost variance, and forecast across all projects
          </p>
        </div>
      </header>

      {/* EVM metrics */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {dashboard.isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-muted h-24 animate-pulse rounded-[14px]"
              />
            ))
          : evmCards.map((metric) => (
              <Card key={metric.id} className="gap-1 p-4">
                <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                  {metric.label}
                </span>
                <span
                  className={cn(
                    "text-2xl leading-7 font-bold",
                    VALUE_TONE[metric.tone],
                  )}
                >
                  {metric.value}
                </span>
                <span className="text-content-tertiary text-[11px]">
                  {metric.sub}
                </span>
              </Card>
            ))}
      </section>

      {/* waterfall + cost mix */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              Budget Consumption by Project
            </h3>
            <p className="text-content-tertiary text-xs">
              Committed + actual vs. planned
            </p>
          </div>
          {waterfall.isLoading ? (
            <div className="bg-surface-muted h-40 animate-pulse rounded-lg" />
          ) : bars.length === 0 ? (
            <p className="text-content-tertiary py-8 text-center text-sm">
              No budget data yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {bars.map((bar) => (
                <div key={bar.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary truncate font-medium">
                      {bar.label}
                    </span>
                    <span className="text-content-tertiary shrink-0 tabular-nums">
                      {bar.meta}
                    </span>
                  </div>
                  <Progress
                    value={bar.pct}
                    color={bar.color}
                    className="bg-surface-muted h-2"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              Cost Type Mix
            </h3>
            <p className="text-content-tertiary text-xs">Planned cost by type</p>
          </div>
          {costMix.isLoading ? (
            <div className="bg-surface-muted h-32 animate-pulse rounded-lg" />
          ) : mix.slices.length === 0 ? (
            <p className="text-content-tertiary py-8 text-center text-sm">
              No cost plans yet.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative size-32 shrink-0">
                <ChartContainer
                  config={{}}
                  className="aspect-square size-32"
                  initialDimension={{ width: 128, height: 128 }}
                >
                  <PieChart>
                    <Pie
                      data={mix.slices}
                      dataKey="raw"
                      nameKey="label"
                      innerRadius={42}
                      outerRadius={62}
                      strokeWidth={2}
                      stroke="var(--surface-white)"
                    >
                      {mix.slices.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-content-primary text-base font-bold">
                    {formatMoney(mix.total)}
                  </span>
                </div>
              </div>
              <ul className="flex flex-1 flex-col gap-2">
                {mix.slices.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-content-secondary flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="text-content-primary font-semibold">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      {/* forecast + performance */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">Forecast</h3>
            <p className="text-content-tertiary text-xs">
              Estimate at Completion (portfolio)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                Original Budget
              </span>
              <span className="text-content-primary text-xl font-bold">
                {formatMoney(forecast?.original_budget)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                Forecast EAC
              </span>
              <span
                className={cn(
                  "flex items-center gap-2 text-xl font-bold",
                  varianceNegative
                    ? "text-brand-danger"
                    : "text-content-primary",
                )}
              >
                {formatMoney(forecast?.eac)}
                {forecast?.variance_pct != null ? (
                  <span className="flex items-center gap-0.5 text-[11px] font-medium">
                    {varianceNegative ? (
                      <TrendingUp className="size-3" aria-hidden />
                    ) : (
                      <TrendingDown className="size-3" aria-hidden />
                    )}
                    {Math.abs(forecast.variance_pct).toFixed(1)}%
                  </span>
                ) : null}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
              Variance at Completion
            </span>
            <span className="text-content-primary text-base font-semibold">
              {formatMoney(forecast?.variance_amount)}
            </span>
          </div>
        </Card>

        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              Performance
            </h3>
            <p className="text-content-tertiary text-xs">
              Cost &amp; schedule health across the portfolio
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-muted flex flex-col gap-1 rounded-lg p-3">
              <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                Cost (CPI)
              </span>
              <span className="text-content-primary text-lg font-bold">
                {evm?.cpi == null ? "—" : evm.cpi.toFixed(2)}
              </span>
              <span className="text-content-tertiary text-[11px]">
                {humanizeLabel(evm?.cost_performance_label)}
              </span>
            </div>
            <div className="bg-surface-muted flex flex-col gap-1 rounded-lg p-3">
              <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                Schedule (SPI)
              </span>
              <span className="text-content-primary text-lg font-bold">
                {evm?.spi == null ? "—" : evm.spi.toFixed(2)}
              </span>
              <span className="text-content-tertiary text-[11px]">
                {humanizeLabel(evm?.schedule_performance_label)}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* cost detail by WBS element */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-0.5 px-5 pt-5 pb-3">
          <h3 className="text-content-primary text-sm font-semibold">
            Cost Detail
          </h3>
          <p className="text-content-tertiary text-xs">
            By WBS element across all projects
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>WBS Element</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Planned</TableHead>
              <TableHead>Committed</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead className="text-end">% Consumed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waterfall.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Loading cost detail…
                </TableCell>
              </TableRow>
            ) : costDetail.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  No cost detail yet.
                </TableCell>
              </TableRow>
            ) : (
              costDetail.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-content-primary text-[13px] font-medium">
                    <span className="text-content-tertiary me-2 font-mono text-[11px]">
                      {row.code}
                    </span>
                    {row.element}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px]">
                    {row.typeLabel}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px] tabular-nums">
                    {row.planned}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px] tabular-nums">
                    {row.committed}
                  </TableCell>
                  <TableCell className="text-content-primary text-[13px] font-semibold tabular-nums">
                    {row.actual}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] font-semibold tabular-nums",
                      VARIANCE_TONE[row.varianceTone],
                    )}
                  >
                    {row.variance}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={Math.min(row.consumed, 100)}
                        color={
                          row.consumed > 100
                            ? "red"
                            : row.consumed >= 85
                              ? "amber"
                              : "emerald"
                        }
                        className="bg-surface-muted h-1.5 w-20"
                      />
                      <span
                        className={cn(
                          "w-10 text-end text-xs font-semibold tabular-nums",
                          row.consumed > 100
                            ? "text-brand-danger"
                            : "text-content-secondary",
                        )}
                      >
                        {row.consumed}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
