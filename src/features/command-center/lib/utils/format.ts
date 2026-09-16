/** Formats a summary/key-metric amount as e.g. `"EGP 184,000"`, using the response's own `currency_code`. */
export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Plain thousands-grouped integer, e.g. for headcount. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
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
