"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card } from "@/src/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"
import { cn } from "@/src/shared/lib/utils/utils"

import { useRevenueTrend } from "../lib/queries/revenue-trend"
import type { RevenueTrendRange } from "../lib/types/revenue-trend"
import { CommandCenterSectionSpinner } from "./shared/command-center-loading"
import { CommandCenterErrorState } from "./shared/command-center-error-state"

const revenueChartConfig = {
  cash_in: { label: "Cash In", color: "var(--brand-primary)" },
  cash_out: { label: "Cash Out", color: "var(--brand-danger)" },
} satisfies ChartConfig

const RANGE_OPTIONS: { key: RevenueTrendRange; label: string; pillLabel: string }[] = [
  { key: "6m", label: "6 Months", pillLabel: "6 Months" },
  { key: "12m", label: "12 Months", pillLabel: "12 Months" },
  { key: "ytd", label: "Year to Date", pillLabel: "Year to Date" },
  { key: "all", label: "All", pillLabel: "All Time" },
]

export function RevenueTrendSection() {
  const [range, setRange] = React.useState<RevenueTrendRange>("12m")
  const { data, isLoading, isError, refetch } = useRevenueTrend(range)

  const activeLabel =
    RANGE_OPTIONS.find((option) => option.key === range)?.pillLabel ?? "12 Months"

  return (
    <Card
      variant="elevated"
      className="flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border-stroke-default pt-6 pb-1 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
    >
      <div className="flex flex-col gap-4 px-6 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-content-primary">
                Revenue Overview
              </p>
              <span className="inline-flex items-center gap-2 rounded-lg border border-stroke-default bg-surface-hover px-2 py-0.5 text-[11px] text-content-tertiary">
                <Calendar className="size-3" />
                {activeLabel}
              </span>
            </div>
            <p className="text-xs text-content-quaternary">
              Cash in vs. cash out, historical only
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {RANGE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] transition-colors",
                  range === key
                    ? "bg-brand-primary text-white"
                    : "text-content-tertiary hover:bg-surface-hover",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        {isLoading ? (
          <CommandCenterSectionSpinner />
        ) : isError ? (
          <CommandCenterErrorState
            message="Failed to load revenue trend."
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <ChartContainer
              config={revenueChartConfig}
              className="aspect-auto h-[200px] w-full"
            >
              <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
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
                  width={44}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  className="text-[11px] text-content-quaternary"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="cash_in"
                  stroke="var(--color-cash_in)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cash_out"
                  stroke="var(--color-cash_out)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] text-content-tertiary">
              <div className="flex items-center gap-2">
                <span className="bg-brand-primary h-0.5 w-5 rounded-sm" />
                Cash In
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-brand-danger h-0.5 w-5 rounded-sm border-t border-dotted border-brand-danger" />
                Cash Out
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
