import * as React from "react"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Card } from "./card"

type KpiAccent = "indigo" | "emerald" | "amber" | "blue" | "red" | "violet"
type KpiTrendDirection = "up" | "down" | "neutral"

const accentTileStyles: Record<KpiAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  emerald: "bg-brand-success/10 text-brand-success",
  amber:
    "bg-brand-warning/15 text-brand-warning dark:bg-brand-warning/20 dark:text-brand-warning",
  blue: "bg-brand-info/10 text-brand-info",
  red: "bg-brand-danger/10 text-brand-danger",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
}

const trendStyles: Record<KpiTrendDirection, string> = {
  up: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200",
  down: "bg-red-50 text-red-800 dark:bg-red-950/45 dark:text-red-200",
  neutral: "bg-surface-hover text-content-tertiary",
}

const trendIcon: Record<KpiTrendDirection, React.ComponentType<{ className?: string }>> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
}

type KpiCardProps = Omit<React.ComponentProps<typeof Card>, "children" | "title"> & {
  icon: React.ReactNode
  accent?: KpiAccent
  value: React.ReactNode
  label: React.ReactNode
  trend?: KpiTrendDirection
  trendValue?: React.ReactNode
  showTrendIcon?: boolean
}

function KpiCard({
  className,
  icon,
  accent = "indigo",
  value,
  label,
  trend,
  trendValue,
  showTrendIcon = false,
  variant = "elevated",
  ...props
}: KpiCardProps) {
  const TrendIconComp = trend ? trendIcon[trend] : null
  return (
    <Card
      data-slot="kpi-card"
      variant={variant}
      className={cn("gap-1 p-5", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div
          data-slot="kpi-card-icon"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-5",
            accentTileStyles[accent],
          )}
        >
          {icon}
        </div>
        {trendValue !== undefined && (
          <span
            data-slot="kpi-card-trend"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs leading-4 font-medium",
              trendStyles[trend ?? "neutral"],
            )}
          >
            {showTrendIcon && TrendIconComp ? (
              <TrendIconComp className="size-3" />
            ) : null}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-content-primary pt-2 text-2xl leading-8 font-bold">
        {value}
      </p>
      <p className="text-content-tertiary text-xs leading-4">{label}</p>
    </Card>
  )
}

export { KpiCard }
export type { KpiAccent, KpiTrendDirection, KpiCardProps }
