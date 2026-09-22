import type { Row } from "../../demo-db"

/**
 * Finance runs on its own demo calendar, frozen at the moment the Figma
 * design was drawn: March is being closed and April is the open period. The
 * global `DEMO_TODAY` (used by HR, Sales, …) is deliberately left alone.
 */
export const FIN_TODAY = "2026-03-31"
/** The assistant's clock in the design ("Last computed 14:49"); cash was refreshed at 09:14. */
export const FIN_NOW = "2026-03-31T14:49:00.000Z"
export const FIN_OPEN_PERIOD = "2026-04"
export const FIN_CLOSING_PERIOD = "2026-03"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** January and February are closed (reopenable); December 2025 is sealed by year-end. */
const CLOSED: Record<number, string> = { 1: "2026-02-06", 2: "2026-03-07" }

function periodStatus(month: number): string {
  if (month <= 2) return "closed"
  if (month === 3) return "closing"
  if (month === 4) return "open"
  return "future"
}

function lastDay(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

export function buildFinancePeriods(): Row[] {
  const december = {
    id: "2025-12",
    label: "Dec 2025",
    fiscal_year: "FY2025",
    status: "locked",
    start_date: "2025-12-01",
    end_date: "2025-12-31",
    closed_by: "Karim Fouad",
    closed_on: "2026-01-08",
    log: [],
  }
  return [
    december,
    ...MONTHS.map((name, index) => {
      const month = index + 1
      const id = `2026-${String(month).padStart(2, "0")}`
      return {
        id,
        label: `${name} 2026`,
        fiscal_year: "FY2026",
        status: periodStatus(month),
        start_date: `${id}-01`,
        end_date: lastDay(2026, month),
        closed_by: CLOSED[month] ? "Karim Fouad" : null,
        closed_on: CLOSED[month] ?? null,
        log: [],
      }
    }),
  ]
}
