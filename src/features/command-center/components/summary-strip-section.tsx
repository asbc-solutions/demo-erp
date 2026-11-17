import { Activity, Clock, Target, TrendingUp, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"
import type { Locale } from "@/src/i18n/routing"

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

type SummaryTranslator = ReturnType<typeof useTranslations<"CommandCenterSummary">>

function buildStripItems(
  strip: CommandCenterStrip,
  currencyCode: string,
  locale: Locale,
  t: SummaryTranslator,
) {
  return [
    {
      label: t("runway"),
      value: t("runwayDays", {
        count: strip.runway_days,
        value: formatNumber(strip.runway_days, locale),
      }),
      accent: "amber" as const,
      Icon: Clock,
    },
    {
      label: t("mrr"),
      value: formatCurrency(strip.mrr, currencyCode, locale),
      accent: "indigo" as const,
      Icon: TrendingUp,
    },
    {
      label: t("burnRate"),
      value: formatCurrency(strip.burn_rate, currencyCode, locale),
      accent: "red" as const,
      Icon: Activity,
    },
    {
      label: t("headcount"),
      value: formatNumber(strip.headcount, locale),
      accent: "emerald" as const,
      Icon: Users,
    },
    {
      label: t("pipeline"),
      value: formatCurrency(strip.pipeline_value, currencyCode, locale),
      accent: "amber" as const,
      Icon: Target,
    },
  ]
}

export function SummaryStripSection({
  strip,
  currencyCode,
}: Readonly<{ strip: CommandCenterStrip; currencyCode: string }>) {
  const t = useTranslations("CommandCenterSummary")
  const locale = useLocale()
  const items = buildStripItems(strip, currencyCode, locale, t)

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
