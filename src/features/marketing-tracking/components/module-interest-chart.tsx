"use client"

import * as React from "react"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ModuleTotal } from "../lib/types"
import { formatDuration } from "../lib/format"

/** Ranked bars read top-down, so the palette darkens with interest. */
const BAR_COLORS = [
  "var(--brand-primary)",
  "var(--brand-info)",
  "var(--brand-success)",
  "var(--brand-warning)",
  "var(--brand-danger)",
]

type Metric = "views" | "msSpent" | "visitors"

const METRICS: { id: Metric; label: string }[] = [
  { id: "views", label: "Page views" },
  { id: "msSpent", label: "Time spent" },
  { id: "visitors", label: "Visitors" },
]

const chartConfig = {
  value: { label: "Interest", color: "var(--brand-primary)" },
} satisfies ChartConfig

export function ModuleInterestChart({ totals }: { totals: ModuleTotal[] }) {
  const [metric, setMetric] = React.useState<Metric>("views")

  const data = React.useMemo(
    () =>
      [...totals]
        .sort((a, b) => b[metric] - a[metric])
        .map((entry) => ({
          label: entry.label,
          value: entry[metric],
          views: entry.views,
          msSpent: entry.msSpent,
          visitors: entry.visitors,
        })),
    [totals, metric],
  )

  const hasData = data.some((entry) => entry.value > 0)

  return (
    <Card variant="elevated" className="p-6">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 p-0 pb-5">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base leading-6 font-semibold">
            Module interest
          </CardTitle>
          <CardDescription className="text-xs leading-4">
            Which parts of the ERP prospects actually open
          </CardDescription>
        </div>
        <div className="border-stroke-default bg-surface-page flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
          {METRICS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMetric(option.id)}
              aria-pressed={metric === option.id}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs leading-4 font-medium transition-colors",
                metric === option.id
                  ? "bg-surface-white text-content-primary shadow-sm"
                  : "text-content-tertiary hover:text-content-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[320px] w-full"
            initialDimension={{ width: 640, height: 320 }}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
              barCategoryGap={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={132}
                tick={{ fontSize: 12 }}
                className="text-content-secondary"
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-surface-hover)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="text-content-primary font-mono text-xs">
                        {metric === "msSpent"
                          ? formatDuration(Number(value))
                          : Number(value).toLocaleString()}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.label}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                    fillOpacity={1 - Math.min(0.55, index * 0.06)}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  className="fill-content-tertiary text-[11px]"
                  formatter={(value) =>
                    metric === "msSpent"
                      ? formatDuration(Number(value))
                      : Number(value).toLocaleString()
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-content-tertiary py-16 text-center text-sm leading-5">
            No module activity recorded yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
