import { toIntlLocale } from "@/src/i18n/intl-locale"
import type { Locale } from "@/src/i18n/routing"

/**
 * Formats a summary/key-metric amount as e.g. `"EGP 184,000"`, using the response's own `currency_code`.
 * English keeps the `en-EG` shape; other locales use their own `Intl` tag.
 */
export function formatCurrency(amount: number, currencyCode: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-EG" : toIntlLocale(locale), {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Plain thousands-grouped integer, e.g. for headcount. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(value)
}

/**
 * `trend_pct: null` means "no prior period to compare" and must never render
 * as "0%" — the .bru docs are explicit about this. Renders an em dash instead.
 */
export function formatTrendPct(trendPct: number | null): string {
  if (trendPct === null) return "—"
  const sign = trendPct > 0 ? "+" : ""
  return `${sign}${trendPct}%`
}
