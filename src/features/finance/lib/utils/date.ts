/**
 * Finance dates are calendar days (`YYYY-MM-DD`) or UTC timestamps. Both are
 * rendered in UTC so a date never shifts by a day with the viewer's timezone.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
})

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
})

const PERIOD_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

function toDate(value: string): Date {
  return new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)
}

/** `2026-03-31` → `31 Mar 2026` */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return DATE_FORMAT.format(toDate(value))
}

/** `2026-03-31T09:14:00Z` → `31 Mar 2026 · 09:14` */
export function formatDateTime(value: string | null | undefined, separator = " · "): string {
  if (!value) return "—"
  const date = toDate(value)
  return `${DATE_FORMAT.format(date)}${separator}${TIME_FORMAT.format(date)}`
}

/** `2026-03-30T11:20:00Z` → `30 Mar · 11:20`, for lists within one year. */
export function formatShortDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = toDate(value)
  return `${SHORT_DATE_FORMAT.format(date)} · ${TIME_FORMAT.format(date)}`
}

/** `2026-02-28` → `28 Feb` */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—"
  return SHORT_DATE_FORMAT.format(toDate(value))
}

/** `2026-03-31T14:49:00Z` → `14:49` */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—"
  return TIME_FORMAT.format(toDate(value))
}

/** `2026-04` → `Apr 2026` */
export function formatPeriod(period: string): string {
  return PERIOD_FORMAT.format(toDate(`${period}-01`))
}

/** `2026-03-01`, `2026-03-31` → `1 Mar — 31 Mar 2026` */
export function formatPeriodRange(start: string, end: string): string {
  const from = toDate(start)
  const to = toDate(end)
  const day = (date: Date) => date.getUTCDate()
  const month = (date: Date) => SHORT_DATE_FORMAT.formatToParts(date).find((part) => part.type === "month")?.value
  return `${day(from)} ${month(from)} — ${day(to)} ${month(to)} ${to.getUTCFullYear()}`
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000)
}
