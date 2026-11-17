/** Localised month name for a 1-based month number, e.g. `monthName(3, "en-US")` → "March". */
export function monthName(month: number, locale: string, style: "long" | "short" = "long"): string {
  return new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" }).format(Date.UTC(2026, month - 1, 1))
}

/** The twelve month numbers, 1–12. */
export const MONTH_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1)
