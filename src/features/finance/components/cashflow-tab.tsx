"use client"

import * as React from "react"
import { Sliders } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"

import { useFinanceCashflowRunway, useFinanceCashflowTimeline } from "../lib/queries/cashflow"
import type { FinanceCashflowRunwayStatus } from "../lib/types"
import { formatCurrency } from "../lib/utils/currency"
import { FinanceErrorState } from "./shared/finance-error-state"
import { FinancePageSpinner } from "./shared/finance-loading"

const cashflowChartConfig = {
  cash_in: { label: "Cash In", color: "#10b981" },
  cash_out: { label: "Cash Out", color: "#ef4444" },
} satisfies ChartConfig

const RUNWAY_STATUS_LABEL: Record<FinanceCashflowRunwayStatus, string> = {
  critical: "Critical",
  monitor: "Monitor",
  healthy: "Healthy",
}

const RUNWAY_STATUS_VARIANT: Record<FinanceCashflowRunwayStatus, "danger" | "warning" | "success"> = {
  critical: "danger",
  monitor: "warning",
  healthy: "success",
}

const RUNWAY_STATUS_TEXT_CLASS: Record<FinanceCashflowRunwayStatus, string> = {
  critical: "bg-brand-danger/12 text-brand-danger",
  monitor: "bg-brand-warning/12 text-brand-warning",
  healthy: "bg-brand-success/12 text-brand-success",
}

function ScenarioSlider({
  label,
  helper,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  helper: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  const fraction = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] leading-[18px] font-medium text-content-tertiary">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-brand-primary h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={{
          backgroundImage: `linear-gradient(to right, var(--color-brand-primary) 0%, var(--color-brand-primary) ${fraction}%, #f4f4f5 ${fraction}%, #f4f4f5 100%)`,
        }}
        aria-label={label}
      />
      <p className="text-[11px] leading-[15.4px] text-content-quaternary">{helper}</p>
    </div>
  )
}

export function CashflowTab() {
  const [growthRate, setGrowthRate] = React.useState(8)
  const [headcountChange, setHeadcountChange] = React.useState(0)
  const [pricingChange, setPricingChange] = React.useState(0)
  const [marketingSpend, setMarketingSpend] = React.useState(0)

  const runwayQuery = useFinanceCashflowRunway()
  const timelineQuery = useFinanceCashflowTimeline("12m")

  const isLoading = runwayQuery.isLoading || timelineQuery.isLoading
  const isError = runwayQuery.isError || timelineQuery.isError

  if (isLoading) return <FinancePageSpinner />
  if (isError || !runwayQuery.data || !timelineQuery.data) {
    return (
      <FinanceErrorState
        message="Failed to load cashflow data."
        onRetry={() => {
          void runwayQuery.refetch()
          void timelineQuery.refetch()
        }}
      />
    )
  }

  const runway = runwayQuery.data
  const timeline = timelineQuery.data
  const isHealthyUnlimited = runway.runway_days === -1

  const projectionIndex = timeline.findIndex((p) => p.projected)
  const projectionMonth = projectionIndex > 0 ? timeline[projectionIndex - 1].month : undefined
  const historicalCount = timeline.filter((p) => !p.projected).length
  const projectedCount = timeline.filter((p) => p.projected).length

  const scenarioRunwayDays = isHealthyUnlimited
    ? null
    : Math.round(
        runway.runway_days +
          growthRate * 1.4 +
          headcountChange * -6 +
          pricingChange * 0.8 +
          marketingSpend / -2500,
      )

  return (
    <div className="flex flex-col gap-6">
      <Card
        variant="elevated"
        className="rounded-2xl border-stroke-default p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs leading-[18px] text-content-quaternary">
              Runway
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[48px] leading-[48px] font-bold text-content-primary">
                {isHealthyUnlimited ? "∞" : runway.runway_days}
              </span>
              {!isHealthyUnlimited ? (
                <span className="text-[31px] leading-[37px] text-content-tertiary">
                  days
                </span>
              ) : null}
            </div>
            <span className="text-xs leading-[18px] text-content-tertiary">
              At {formatCurrency(runway.burn_rate, runway.currency_code)}/mo burn rate
            </span>
          </div>
          <Badge
            variant={RUNWAY_STATUS_VARIANT[runway.status]}
            className={`rounded-lg border border-transparent px-3 py-1 text-[12px] font-medium ${RUNWAY_STATUS_TEXT_CLASS[runway.status]}`}
          >
            {RUNWAY_STATUS_LABEL[runway.status]}
          </Badge>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#f4f4f5]">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${runway.progress_pct}%`,
                backgroundImage:
                  "linear-gradient(90deg, #ef4444 0%, #f59e0b 33%, #10b981 66%, #6366f1 100%)",
              }}
            />
          </div>
          <div className="relative h-4">
            {runway.markers.map((marker) => (
              <div
                key={marker.label}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${marker.position}%` }}
              >
                <div className="h-2 w-px bg-[#d4d4d8]" />
                <span className="pt-0.5 text-[9px] leading-[13.5px] text-content-quaternary">
                  {marker.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] leading-[15.4px] text-content-quaternary">
            <span>0 days</span>
            <span>365 days</span>
          </div>
        </div>
      </Card>

      <Card
        variant="elevated"
        className="rounded-2xl border-stroke-default py-6"
      >
        <div className="flex flex-col gap-1.5 px-6">
          <h3 className="text-sm leading-[22px] font-semibold text-content-primary">
            Cash Flow Timeline
          </h3>
          <p className="text-xs leading-[18px] text-content-quaternary">
            {historicalCount} historical + {projectedCount} projected months
          </p>
        </div>
        <div className="flex flex-col gap-4 px-6 pt-4">
          <ChartContainer
            config={cashflowChartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={timeline}
              margin={{ left: 8, right: 8, top: 8, bottom: 4 }}
            >
              <defs>
                <linearGradient id="cashflowIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cashflowOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                className="stroke-stroke-default"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[11px] text-content-quaternary"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                width={48}
                className="text-[11px] text-content-quaternary"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {projectionMonth && (
                <ReferenceLine
                  x={projectionMonth}
                  stroke="#a1a1aa"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <Area
                type="monotone"
                dataKey="cash_in"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#cashflowIn)"
              />
              <Area
                type="monotone"
                dataKey="cash_out"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="url(#cashflowOut)"
              />
            </AreaChart>
          </ChartContainer>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs leading-[18px] text-content-tertiary">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-brand-success" />
              Cash In
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-brand-danger" />
              Cash Out
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-3 border-t border-dashed border-content-quaternary" />
              Projected
            </div>
          </div>
        </div>
      </Card>

      <Card
        variant="elevated"
        className="rounded-2xl border-stroke-default py-6"
      >
        <div className="flex flex-col gap-1.5 px-6">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-brand-primary" />
            <h3 className="text-sm leading-[22px] font-semibold text-content-primary">
              Runway Scenario Builder
            </h3>
          </div>
          <p className="text-xs leading-[18px] text-content-quaternary">
            Model different growth scenarios (client-side estimate)
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 px-6 pt-4 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ScenarioSlider
              label="Monthly Revenue Growth Rate"
              helper={`${growthRate}% per month`}
              min={0}
              max={30}
              step={1}
              value={growthRate}
              onChange={setGrowthRate}
            />
            <ScenarioSlider
              label="Headcount Change"
              helper={
                headcountChange === 0
                  ? "No change"
                  : `${headcountChange > 0 ? "+" : ""}${headcountChange} people`
              }
              min={-5}
              max={10}
              step={1}
              value={headcountChange}
              onChange={setHeadcountChange}
            />
            <ScenarioSlider
              label="Pricing Adjustment"
              helper={
                pricingChange === 0
                  ? "No change"
                  : `${pricingChange > 0 ? "+" : ""}${pricingChange}% pricing`
              }
              min={-20}
              max={20}
              step={1}
              value={pricingChange}
              onChange={setPricingChange}
            />
            <ScenarioSlider
              label="Marketing Spend Delta"
              helper={
                marketingSpend === 0
                  ? "Hold steady"
                  : `${marketingSpend > 0 ? "+" : ""}${formatCurrency(marketingSpend, runway.currency_code)} / mo`
              }
              min={-25000}
              max={50000}
              step={2500}
              value={marketingSpend}
              onChange={setMarketingSpend}
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-[18px] text-content-quaternary">
              Projected Runway
            </p>
            <div className="flex flex-col gap-2 rounded-2xl border border-brand-success/20 bg-brand-success/[0.06] p-5">
              {isHealthyUnlimited || scenarioRunwayDays === null ? (
                <p className="text-brand-success text-[24px] leading-[30px] font-bold">
                  Cashflow positive — no burn to model
                </p>
              ) : (
                <>
                  <p className="text-brand-success text-[48px] leading-[48px] font-bold">
                    {scenarioRunwayDays} days
                  </p>
                  <span className="inline-flex w-fit rounded-full bg-brand-success/12 px-2 py-0.5 text-[11px] font-medium text-brand-success">
                    {growthRate >= 8 ? "+" : ""}
                    {Math.max(0, growthRate - 8) * 2} days improvement
                  </span>
                </>
              )}
              <p className="pt-1 text-[11px] leading-[15.4px] text-content-tertiary">
                Burn rate: {formatCurrency(runway.burn_rate, runway.currency_code)}/mo
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
