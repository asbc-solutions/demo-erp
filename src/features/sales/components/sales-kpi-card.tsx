import { Briefcase, DollarSign, Target, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import type { SalesKpi, SalesKpiAccent } from "../data/sales-mock"

const accentTint: Record<SalesKpiAccent, string> = {
  indigo: "bg-brand-primary/5",
  emerald: "bg-brand-success/5",
  amber: "bg-brand-warning/5",
  rose: "bg-gradient-to-br from-[rgba(255,32,86,0.05)] to-[rgba(246,51,154,0.05)]",
}

const accentIcon: Record<SalesKpiAccent, string> = {
  indigo: "text-brand-primary",
  emerald: "text-brand-success",
  amber: "text-brand-warning",
  rose: "text-rose-500 dark:text-rose-400",
}

const iconMap = {
  target: Target,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  dollar: DollarSign,
} as const

export function SalesKpiCard({ kpi }: { kpi: SalesKpi }) {
  const t = useTranslations("SalesShared")
  const Icon = iconMap[kpi.icon]
  return (
    <Card
      variant="elevated"
      className={cn(
        "relative gap-2 overflow-hidden p-4",
        accentTint[kpi.accent],
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", accentIcon[kpi.accent])} aria-hidden />
        <span className="text-[11px] leading-[15.4px] text-content-quaternary">
          {t(kpi.labelKey)}
        </span>
      </div>
      <p className="text-content-primary text-[25px] leading-[32.5px] font-semibold">
        {kpi.value}
      </p>
    </Card>
  )
}
