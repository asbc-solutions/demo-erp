const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
]

/**
 * Formats an ISO timestamp as "12 min ago" / "5 hours ago" / "Yesterday" etc. in `locale`;
 * anything under a minute renders the caller's translated `justNow`.
 */
export function formatRelativeTime(
  iso: string,
  { locale, justNow }: Readonly<{ locale: string; justNow: string }>,
): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso

  const diffSeconds = (then - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return justNow
}
