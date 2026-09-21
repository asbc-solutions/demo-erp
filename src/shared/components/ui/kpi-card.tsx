import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Card } from "./card"

type KpiAccent = "indigo" | "emerald" | "amber" | "blue" | "red" | "violet" | "teal"
type KpiTrendDirection = "up" | "down" | "neutral"

const accentTileStyles: Record<KpiAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  emerald: "bg-brand-success/10 text-brand-success",
  amber:
    "bg-brand-warning/15 text-brand-warning dark:bg-brand-warning/20 dark:text-brand-warning",
  blue: "bg-brand-info/10 text-brand-info",
  red: "bg-brand-danger/10 text-brand-danger",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  teal: "bg-series-2/10 text-series-2",
}

/** Top accent bar for `layout="bar"`, drawn from the categorical series. */
const accentBarStyles: Record<KpiAccent, string> = {
  indigo: "bg-series-1",
  teal: "bg-series-2",
  amber: "bg-series-3",
  blue: "bg-series-4",
  emerald: "bg-series-5",
  violet: "bg-series-6",
  red: "bg-status-danger-fg",
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

const kpiCardVariants = cva("", {
  variants: {
    layout: {
      /** Icon tile + trend chip, value, label underneath. */
      icon: "gap-1 p-5",
      /** Coloured top edge, uppercase label, governing figure, caption. */
      bar: "relative gap-2 overflow-hidden px-6 pt-7 pb-5",
    },
  },
  defaultVariants: {
    layout: "icon",
  },
})

type KpiCardProps = Omit<React.ComponentProps<typeof Card>, "children" | "title"> &
  VariantProps<typeof kpiCardVariants> & {
    icon?: React.ReactNode
    accent?: KpiAccent
    value: React.ReactNode
    label: React.ReactNode
    /** Secondary line under the value (`layout="bar"` only). */
    caption?: React.ReactNode
    trend?: KpiTrendDirection
    trendValue?: React.ReactNode
    showTrendIcon?: boolean
  }

function KpiCard({
  className,
  layout,
  icon,
  accent = "indigo",
  value,
  label,
  caption,
  trend,
  trendValue,
  showTrendIcon = false,
  variant = "elevated",
  ...props
}: KpiCardProps) {
  const TrendIconComp = trend ? trendIcon[trend] : null

  if (layout === "bar") {
    return (
      <Card
        data-slot="kpi-card"
        data-layout="bar"
        variant={variant}
        className={cn(kpiCardVariants({ layout }), className)}
        {...props}
      >
        <span
          aria-hidden
          data-slot="kpi-card-accent"
          className={cn("absolute inset-x-0 top-0 h-1", accentBarStyles[accent])}
        />
        <p className="text-content-tertiary text-[11px] leading-4 font-medium tracking-[0.055em] uppercase">
          {label}
        </p>
        <p className="text-content-primary text-2xl leading-8 font-bold tabular-nums">
          {value}
        </p>
        {caption !== undefined && (
          <p className="text-content-tertiary text-xs leading-[18px]">{caption}</p>
        )}
      </Card>
    )
  }

  return (
    <Card
      data-slot="kpi-card"
      data-layout="icon"
      variant={variant}
      className={cn(kpiCardVariants({ layout }), className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        {icon ? (
          <div
            data-slot="kpi-card-icon"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-5",
              accentTileStyles[accent],
            )}
          >
            {icon}
          </div>
        ) : null}
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

export { KpiCard, kpiCardVariants }
export type { KpiAccent, KpiTrendDirection, KpiCardProps }
