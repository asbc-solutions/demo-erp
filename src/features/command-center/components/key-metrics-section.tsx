import {
  AlertTriangle,
  Banknote,
  Clock,
  FileText,
  Receipt,
  Sparkles,
  Target,
  Users,
} from "lucide-react"
import { useLocale } from "next-intl"

import { KpiCard, type KpiTrendDirection } from "@/src/shared/components/ui/kpi-card"

import type { Locale } from "@/src/i18n/routing"

import type { CommandCenterKeyMetric } from "../lib/types/summary"
import { formatCurrency, formatNumber, formatTrendPct } from "../lib/utils/format"

/**
 * Only `mrr` / `collected_revenue` are shown in the docs example payload —
 * `key` isn't an exhaustive enum, so unmapped keys fall back to a generic icon.
 */
function metricIcon(key: string) {
  const c = "size-5"
  switch (key) {
    case "mrr":
    case "collected_revenue":
      return <Banknote className={c} />
    case "burn_rate":
      return <AlertTriangle className={c} />
    case "pipeline_value":
      return <Sparkles className={c} />
    case "headcount":
      return <Users className={c} />
    case "runway_days":
      return <Clock className={c} />
    case "open_deals":
      return <FileText className={c} />
    case "paid_invoices":
      return <Receipt className={c} />
    default:
      return <Target className={c} />
  }
}

function formatMetricValue(
  metric: CommandCenterKeyMetric,
  currencyCode: string,
  locale: Locale,
) {
  if (metric.unit === "currency") return formatCurrency(metric.value, currencyCode, locale)
  if (metric.unit === "percentage") return `${metric.value}%`
  return formatNumber(metric.value, locale)
}

/** Maps the wire `trend_direction` (`up`/`down`/`flat`) to KpiCard's accent set, forcing "neutral" whenever there's no `trend_pct` to show. */
function kpiTrend(metric: CommandCenterKeyMetric): KpiTrendDirection {
  if (metric.trend_pct === null) return "neutral"
  if (metric.trend_direction === "down") return "down"
  if (metric.trend_direction === "flat") return "neutral"
  return "up"
}

export function KeyMetricsSection({
  metrics,
  currencyCode,
}: Readonly<{ metrics: CommandCenterKeyMetric[]; currencyCode: string }>) {
  const locale = useLocale()

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.key} className="relative">
          <div
            className="pointer-events-none absolute inset-0 rounded-[14px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.06) 40%, rgba(139, 92, 246, 0.04) 60%, transparent 100%)",
            }}
            aria-hidden
          />
          <KpiCard
            icon={metricIcon(metric.key)}
            accent="emerald"
            value={formatMetricValue(metric, currencyCode, locale)}
            label={metric.label}
            trend={kpiTrend(metric)}
            trendValue={formatTrendPct(metric.trend_pct)}
            showTrendIcon={metric.trend_pct !== null}
            variant="elevated"
            className="relative z-10 rounded-2xl pt-6 pb-5 [&>p:nth-child(2)]:text-[28px] [&>p:nth-child(2)]:leading-[35px] [&>p:nth-child(3)]:text-xs [&>p:nth-child(3)]:font-medium [&>p:nth-child(3)]:text-content-tertiary"
          />
        </div>
      ))}
    </div>
  )
}
