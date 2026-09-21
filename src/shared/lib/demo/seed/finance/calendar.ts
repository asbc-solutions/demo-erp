import type { Row } from "../../demo-db"

/**
 * Finance runs on its own demo calendar, frozen at the moment the Figma
 * design was drawn: March is being closed and April is the open period. The
 * global `DEMO_TODAY` (used by HR, Sales, …) is deliberately left alone.
 */
export const FIN_TODAY = "2026-03-31"
export const FIN_NOW = "2026-03-31T09:14:00.000Z"
export const FIN_OPEN_PERIOD = "2026-04"
export const FIN_CLOSING_PERIOD = "2026-03"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function periodStatus(month: number): string {
  if (month <= 2) return "locked"
  if (month === 3) return "closing"
  if (month === 4) return "open"
  return "future"
}

function lastDay(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

export function buildFinancePeriods(): Row[] {
  return MONTHS.map((name, index) => {
    const month = index + 1
    const id = `2026-${String(month).padStart(2, "0")}`
    return {
      id,
      label: `${name} 2026`,
      status: periodStatus(month),
      start_date: `${id}-01`,
      end_date: lastDay(2026, month),
    }
  })
}
