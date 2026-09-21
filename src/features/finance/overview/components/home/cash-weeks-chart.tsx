"use client"

import * as React from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"

import { Amount } from "../../../components/shared/amount"
import { ChartTableToggle } from "../../../components/shared/chart-table-toggle"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatAmount } from "../../../lib/utils/money"
import type { CashWeek } from "../../lib/types/overview"

const chartConfig = {
  closing: { label: "Closing balance", color: "var(--series-1)" },
  netRecorded: { label: "Net movement", color: "var(--series-4)" },
  netForecast: { label: "Net movement (forecast)", color: "var(--series-4)" },
} satisfies ChartConfig

const TABLE_COLUMNS: FinanceColumn<CashWeek>[] = [
  { id: "week", header: "Week", cell: (row) => row.week, width: "w-24" },
  {
    id: "basis",
    header: "Basis",
    cell: (row) =>
      row.forecast ? (
        <StatusPill status="simulated" label="forecast" />
      ) : (
        <StatusPill status="posted" label="recorded" />
      ),
  },
  {
    id: "closing",
    header: "Closing balance (EGP)",
    align: "end",
    cell: (row) => <Amount value={row.closing} />,
  },
  {
    id: "net",
    header: "Net movement (EGP)",
    align: "end",
    cell: (row) => <Amount value={row.net_movement} />,
  },
]

/** Axis ticks read in thousands so the scale stays legible at a glance. */
const thousands = (value: number) => Math.round(value / 1_000).toLocaleString("en-US")

type CashWeeksChartProps = { weeks: CashWeek[] }

/**
 * Thirteen weeks of closing cash (bars) and weekly net movement (line).
 * Forecast weeks are shaded, their bars faded and their line dashed so they
 * never read as actual figures.
 */
function CashWeeksChart({ weeks }: CashWeeksChartProps) {
  const recorded = weeks.filter((week) => !week.forecast).length
  const forecast = weeks.length - recorded
  const firstForecast = weeks.find((week) => week.forecast)?.week
  const lastWeek = weeks[weeks.length - 1]?.week
  const lastRecordedIndex = recorded - 1

  const data = weeks.map((week, index) => ({
    week: week.week,
    forecast: week.forecast,
    closing: week.closing,
    netRecorded: week.forecast ? null : week.net_movement,
    // The forecast line starts at the last recorded week so the two join.
    netForecast: week.forecast || index === lastRecordedIndex ? week.net_movement : null,
  }))

  return (
    <ChartTableToggle
      description={`Thirteen weeks of closing cash. ${recorded} weeks are recorded and ${forecast} are forecast; forecast weeks are shaded and are not actual figures.`}
      chart={
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            {firstForecast && lastWeek ? (
              <ReferenceArea
                yAxisId="closing"
                x1={firstForecast}
                x2={lastWeek}
                fill="var(--surface-hover)"
                fillOpacity={0.9}
                label={{ value: "Forecast", position: "insideTop", fill: "var(--content-tertiary)", fontSize: 12 }}
              />
            ) : null}
            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              yAxisId="closing"
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={thousands}
              label={{
                value: "Closing balance (EGP '000)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--content-tertiary)", fontSize: 12 },
              }}
            />
            <YAxis
              yAxisId="net"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={thousands}
              label={{
                value: "Net movement (EGP '000)",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle", fill: "var(--content-tertiary)", fontSize: 12 },
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-content-tertiary">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="text-content-primary font-medium tabular-nums">
                        {formatAmount(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Bar yAxisId="closing" dataKey="closing" radius={[3, 3, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell
                  key={entry.week}
                  fill="var(--color-closing)"
                  fillOpacity={entry.forecast ? 0.35 : 1}
                />
              ))}
            </Bar>
            <Line
              yAxisId="net"
              dataKey="netRecorded"
              stroke="var(--color-netRecorded)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              yAxisId="net"
              dataKey="netForecast"
              stroke="var(--color-netForecast)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ChartContainer>
      }
      table={
        <FinanceTable
          caption="Closing cash and net movement by week"
          columns={TABLE_COLUMNS}
          rows={weeks}
          getRowId={(row) => row.id}
        />
      }
    />
  )
}

export { CashWeeksChart }
