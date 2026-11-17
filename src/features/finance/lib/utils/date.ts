import type { Locale } from "@/src/i18n/routing"

/**
 * Finance dates are calendar days (`YYYY-MM-DD`) or UTC timestamps. Both are
 * rendered in UTC so a date never shifts by a day with the viewer's timezone.
 *
 * Formatters are bound to a UI locale: components get them from
 * `useFinanceDateFormat()`; helpers outside React receive the bound object.
 * English keeps the `en-GB` day-month order (`31 Mar 2026`); Arabic localises
 * month names but keeps Latin digits.
 */

const FINANCE_DATE_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  ar: "ar-EG-u-nu-latn",
}

export interface FinanceDateFormat {
  /** `2026-03-31` → `31 Mar 2026` */
  formatDate: (value: string | null | undefined) => string
  /** `2026-03-31T09:14:00Z` → `31 Mar 2026 · 09:14` */
  formatDateTime: (value: string | null | undefined, separator?: string) => string
  /** `2026-03-30T11:20:00Z` → `30 Mar · 11:20`, for lists within one year. */
  formatShortDateTime: (value: string | null | undefined) => string
  /** `2026-02-28` → `28 Feb` */
  formatShortDate: (value: string | null | undefined) => string
  /** `2026-03-31T14:49:00Z` → `14:49` */
  formatTime: (value: string | null | undefined) => string
  /** `2026-04` → `Apr 2026` */
  formatPeriod: (period: string) => string
  /** `2026-03-01`, `2026-03-31` → `1 Mar — 31 Mar 2026` */
  formatPeriodRange: (start: string, end: string) => string
}

function toDate(value: string): Date {
  return new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)
}

function buildFinanceDateFormat(locale: Locale): FinanceDateFormat {
  const tag = FINANCE_DATE_LOCALE[locale]

  const dateFormat = new Intl.DateTimeFormat(tag, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })

  const timeFormat = new Intl.DateTimeFormat(tag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })

  const shortDateFormat = new Intl.DateTimeFormat(tag, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })

  const periodFormat = new Intl.DateTimeFormat(tag, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })

  const rangeStartFormat = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })

  const rangeEndFormat = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })

  return {
    formatDate(value) {
      if (!value) return "—"
      return dateFormat.format(toDate(value))
    },
    formatDateTime(value, separator = " · ") {
      if (!value) return "—"
      const date = toDate(value)
      return `${dateFormat.format(date)}${separator}${timeFormat.format(date)}`
    },
    formatShortDateTime(value) {
      if (!value) return "—"
      const date = toDate(value)
      return `${shortDateFormat.format(date)} · ${timeFormat.format(date)}`
    },
    formatShortDate(value) {
      if (!value) return "—"
      return shortDateFormat.format(toDate(value))
    },
    formatTime(value) {
      if (!value) return "—"
      return timeFormat.format(toDate(value))
    },
    formatPeriod(period) {
      return periodFormat.format(toDate(`${period}-01`))
    },
    formatPeriodRange(start, end) {
      return `${rangeStartFormat.format(toDate(start))} — ${rangeEndFormat.format(toDate(end))}`
    },
  }
}

/** One immutable formatter set per locale, so callers get a stable reference. */
const FORMAT_CACHE = new Map<Locale, FinanceDateFormat>()

export function createFinanceDateFormat(locale: Locale): FinanceDateFormat {
  let format = FORMAT_CACHE.get(locale)
  if (!format) {
    format = buildFinanceDateFormat(locale)
    FORMAT_CACHE.set(locale, format)
  }
  return format
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000)
}
