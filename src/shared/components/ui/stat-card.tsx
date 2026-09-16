"use client"

import * as React from "react"
import { Area, AreaChart } from "recharts"
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Card } from "./card"
import { ChartContainer, type ChartConfig } from "./chart"

type StatColor = "indigo" | "emerald" | "amber" | "red" | "blue" | "violet"

const COLOR_HEX: Record<StatColor, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  violet: "#8b5cf6",
}

const TREND_COLOR: Record<"up" | "down" | "flat", string> = {
  up: "text-brand-success",
  down: "text-brand-danger",
  flat: "text-content-tertiary",
}

const TREND_ICON: Record<"up" | "down" | "flat", LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

type Trend = "up" | "down" | "flat"

type StatCardProps = React.ComponentProps<typeof Card> & {
  label: string
  value: React.ReactNode
  /** Trend percentage text, e.g. "+12.5%". */
  trendText?: string
  /** Direction of the trend. Drives icon + color. Defaults to inferred from text. */
  trend?: Trend
  /** Sparkline data series. */
  data?: number[]
  /** Sparkline color. Defaults to match the trend direction. */
  sparkColor?: StatColor
}

function inferTrend(text?: string): Trend {
  if (!text) return "flat"
  if (text.trim().startsWith("-")) return "down"
  if (text.trim().startsWith("+")) return "up"
  return "flat"
}

function Sparkline({
  data,
  color,
}: Readonly<{
  data: number[]
  color: StatColor
}>) {
  const chartData = React.useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data],
  )
  const config = React.useMemo<ChartConfig>(
    () => ({ value: { color: COLOR_HEX[color] } }),
    [color],
  )
  const gradientId = React.useId()

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-8 w-16 [&_.recharts-surface]:overflow-visible"
    >
      <AreaChart
        data={chartData}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-value)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-value)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

function StatCard({
  className,
  label,
  value,
  trendText,
  trend,
  data,
  sparkColor,
  ...props
}: StatCardProps) {
  const direction = trend ?? inferTrend(trendText)
  const TrendIcon = TREND_ICON[direction]
  const trendColorClass = TREND_COLOR[direction]

  const directionToSparkColor: Record<Trend, StatColor> = {
    up: "emerald",
    down: "red",
    flat: "indigo",
  }
  const finalSparkColor: StatColor =
    sparkColor ?? directionToSparkColor[direction]

  return (
    <Card className={cn("flex flex-col gap-1 p-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-content-tertiary text-xs leading-4">
          {label}
        </span>
        <TrendIcon className={cn("size-4", trendColorClass)} aria-hidden />
      </div>
      <p className="text-content-primary pt-1 text-xl leading-7 font-bold">
        {value}
      </p>
      <div className="flex items-center justify-between">
        {trendText ? (
          <span
            className={cn("text-xs leading-4 font-medium", trendColorClass)}
          >
            {trendText}
          </span>
        ) : (
          <span />
        )}
        {data && data.length > 1 && (
          <Sparkline data={data} color={finalSparkColor} />
        )}
      </div>
    </Card>
  )
}

export { StatCard }
