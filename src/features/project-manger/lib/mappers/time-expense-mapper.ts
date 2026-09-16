import type { Timesheet, TimesheetSummary } from "../types"

/* ------------------------------------------------------------------ */
/* Week helpers                                                        */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000

/** Monday of the current week as `YYYY-MM-DD`. */
export function currentWeekStart(): string {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow)
  return monday.toISOString().slice(0, 10)
}

/** Shift a `YYYY-MM-DD` week start by whole weeks. */
export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + deltaWeeks * 7)
  return d.toISOString().slice(0, 10)
}

function dayIndex(from: string, date: string): number {
  return Math.round(
    (new Date(date).getTime() - new Date(from).getTime()) / DAY_MS,
  )
}

/* ------------------------------------------------------------------ */
/* Grid view model                                                     */
/* ------------------------------------------------------------------ */

export type TimesheetDay = { label: string; date: string }

export type TimesheetGridRow = {
  id: string
  task: string
  project: string
  billable: boolean
  hours: (number | null)[]
  total: number
}

export type TimesheetGrid = {
  days: TimesheetDay[]
  rows: TimesheetGridRow[]
  dayTotals: number[]
  weekTotal: number
  periodLabel: string
}

function fmt(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("en-US", opts)
}

export function buildTimesheetGrid(
  timesheet: Timesheet | undefined,
): TimesheetGrid {
  if (!timesheet) {
    return { days: [], rows: [], dayTotals: [], weekTotal: 0, periodLabel: "" }
  }

  const start = new Date(timesheet.period_start)
  const days: TimesheetDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY_MS)
    return { label: fmt(d, { weekday: "short" }), date: d.toISOString().slice(0, 10) }
  })

  const rows: TimesheetGridRow[] = timesheet.rows.map((row) => {
    const hours: (number | null)[] = Array(7).fill(null)
    for (const entry of row.entries) {
      const idx = dayIndex(timesheet.period_start, entry.log_date)
      if (idx >= 0 && idx < 7)
        hours[idx] = (hours[idx] ?? 0) + Number(entry.hours)
    }
    return {
      id: row.row_id,
      task: row.task_title,
      project: row.project_name,
      billable: row.billable,
      hours,
      total: Number(row.total_hours),
    }
  })

  const dayTotals = days.map((_, i) =>
    rows.reduce((sum, r) => sum + (r.hours[i] ?? 0), 0),
  )
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0)

  const end = new Date(timesheet.period_end)
  const periodLabel = `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(
    end,
    { month: "short", day: "numeric", year: "numeric" },
  )}`

  return { days, rows, dayTotals, weekTotal, periodLabel }
}

/* ------------------------------------------------------------------ */
/* Summary stat cards                                                  */
/* ------------------------------------------------------------------ */

export type TimeStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "check" | "dollar" | "flag" | "diamond"
  accent: "indigo" | "emerald" | "amber" | "violet"
}

function money(amount: number, currency: string): string {
  return `${Math.round(amount).toLocaleString()} ${currency}`
}

export function buildTimeStats(
  summary: TimesheetSummary | undefined,
): TimeStat[] {
  return [
    {
      id: "posted",
      label: "Hours Posted",
      value: summary ? `${summary.hours_posted}h` : "—",
      caption: summary ? `${summary.billable_hours}h billable` : "",
      icon: "check",
      accent: "indigo",
    },
    {
      id: "billable",
      label: "Billable",
      value: summary ? `${Math.round(summary.billable_pct)}%` : "—",
      caption: "of posted hours",
      icon: "diamond",
      accent: "emerald",
    },
    {
      id: "pending",
      label: "Pending Approval",
      value: summary ? String(summary.pending_approval_count) : "—",
      caption: "entries",
      icon: "flag",
      accent: "amber",
    },
    {
      id: "expenses",
      label: "Expenses",
      value: summary ? money(summary.expense_amount, summary.currency_code) : "—",
      caption: summary ? `${summary.receipt_count} receipts` : "",
      icon: "dollar",
      accent: "violet",
    },
  ]
}
