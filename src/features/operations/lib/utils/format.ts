/**
 * Operations currency is set server-side via `config/operations.php`, not per-request —
 * every `.bru` response example uses EGP. List endpoints echo the resolved
 * `currency_code` per row; KPI aggregate endpoints don't, so those fall back to this.
 */
export const DEFAULT_CURRENCY_CODE = "EGP"

/** `locale` is the active `Intl` tag — pass `useIntlLocale()` from the calling component. */
export function formatCurrencyAmount(
  value: number,
  locale: string,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
