export type DateRangePreset = "30d" | "90d" | "year" | "all"

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

/** Computes {date_from, date_to} for the Reports date-range filter. "all" omits both. */
export function computeDateRange(preset: DateRangePreset): {
  date_from?: string
  date_to?: string
} {
  if (preset === "all") return {}

  const now = new Date()
  const from = new Date(now)

  if (preset === "30d") from.setDate(now.getDate() - 30)
  else if (preset === "90d") from.setDate(now.getDate() - 90)
  else from.setMonth(0, 1) // "year" → start of current year

  return { date_from: toIsoDate(from), date_to: toIsoDate(now) }
}
