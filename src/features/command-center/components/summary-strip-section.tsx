import { Activity, Clock, Target, TrendingUp, Users } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import type { CommandCenterStrip } from "../lib/types/summary"
import { formatCurrency, formatNumber } from "../lib/utils/format"

type StripAccent = "amber" | "indigo" | "red" | "emerald"

const summaryAccentClass: Record<StripAccent, string> = {
  amber: "border-s-brand-warning",
  indigo: "border-s-brand-primary",
  red: "border-s-brand-danger",
  emerald: "border-s-brand-success",
}

const summaryIconGradient: Record<StripAccent, string> = {
  amber: "from-brand-warning/15 to-transparent",
  indigo: "from-brand-primary/15 to-transparent",
  red: "from-brand-danger/15 to-transparent",
  emerald: "from-brand-success/15 to-transparent",
}

const summaryIconText: Record<StripAccent, string> = {
  amber: "text-brand-warning",
  indigo: "text-brand-primary",
  red: "text-brand-danger",
  emerald: "text-brand-success",
}

function buildStripItems(strip: CommandCenterStrip, currencyCode: string) {
  return [
    {
      label: "Runway",
      value: `${formatNumber(strip.runway_days)} days`,
      accent: "amber" as const,
      Icon: Clock,
    },
    {
      label: "MRR",
      value: formatCurrency(strip.mrr, currencyCode),
      accent: "indigo" as const,
      Icon: TrendingUp,
    },
    {
      label: "Burn Rate",
      value: formatCurrency(strip.burn_rate, currencyCode),
      accent: "red" as const,
      Icon: Activity,
    },
    {
      label: "Headcount",
      value: formatNumber(strip.headcount),
      accent: "emerald" as const,
      Icon: Users,
    },
    {
      label: "Pipeline",
      value: formatCurrency(strip.pipeline_value, currencyCode),
      accent: "amber" as const,
      Icon: Target,
    },
  ]
}

export function SummaryStripSection({
  strip,
  currencyCode,
}: Readonly<{ strip: CommandCenterStrip; currencyCode: string }>) {
  const items = buildStripItems(strip, currencyCode)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card
          key={item.label}
          variant="elevated"
          className={cn(
            "gap-2 rounded-2xl border py-[17px] pe-[17px] ps-[18px]",
            "border-stroke-default border-s-[1.5px]",
            summaryAccentClass[item.accent],
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex rounded-xl bg-gradient-to-br p-1.5 text-content-primary",
                summaryIconGradient[item.accent],
              )}
            >
              <span className={summaryIconText[item.accent]}>
                <item.Icon className="size-4" />
              </span>
            </div>
            <span className="text-[11px] leading-[15.4px] text-content-quaternary">
              {item.label}
            </span>
          </div>
          <p className="text-[31px] leading-[37px] font-bold text-content-primary">
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
