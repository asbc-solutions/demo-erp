import type { AvatarColor } from "../../all-project/data/all-projects-data"
import type {
  ProjectUtilizationRow,
  ResourceHeatmapRow,
  ResourcePlannerSummary,
  ResourcePoolItem,
} from "../types"

const AVATAR_COLORS: AvatarColor[] = [
  "primary",
  "info",
  "success",
  "warning",
  "danger",
]

/** First letters of the first two words, e.g. "Ahmed Mohamed" → "AM". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  const letters = parts.slice(0, 2).map((p) => p[0]!.toUpperCase())
  return letters.join("")
}

/** Stable avatar color from a seed (employee id / name). */
export function avatarColorFor(seed: string): AvatarColor {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export type UtilizationSummary = {
  total: number
  overloaded: number
  avgAllocation: number
  totalPlannedHours: number
}

export function summarizeUtilization(
  rows: ProjectUtilizationRow[],
): UtilizationSummary {
  if (!rows.length) {
    return { total: 0, overloaded: 0, avgAllocation: 0, totalPlannedHours: 0 }
  }
  const overloaded = rows.filter((r) => r.total_allocation_pct > 100).length
  const totalAllocation = rows.reduce((a, r) => a + r.total_allocation_pct, 0)
  const totalPlannedHours = rows.reduce((a, r) => a + r.total_planned_hours, 0)
  return {
    total: rows.length,
    overloaded,
    avgAllocation: Math.round(totalAllocation / rows.length),
    totalPlannedHours,
  }
}

/* ------------------------------------------------------------------ */
/* Standalone Resource Planner (portfolio)                             */
/* ------------------------------------------------------------------ */

/** First & last day of the current month as `YYYY-MM-DD` (heatmap/summary period). */
export function currentMonthRange(): { from: string; to: string } {
  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: iso(from), to: iso(to) }
}

/** `2026-06-29` → `Jun 29` (localised by `locale`). */
function shortDate(value: string, locale: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" })
}

export type PlannerStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "users" | "zap" | "alert" | "sparkles"
  accent: "indigo" | "emerald" | "red" | "violet"
}

export function buildPlannerStats(
  summary: ResourcePlannerSummary | undefined,
): PlannerStat[] {
  return [
    {
      id: "total",
      label: "Total Resources",
      value: summary ? String(summary.total_resources) : "—",
      caption: summary ? `${summary.department_count} departments` : "",
      icon: "users",
      accent: "indigo",
    },
    {
      id: "utilization",
      label: "Avg Utilization",
      value: summary ? `${Math.round(summary.average_utilization_pct)}%` : "—",
      caption: "across the period",
      icon: "zap",
      accent: "emerald",
    },
    {
      id: "overloaded",
      label: "Overloaded",
      value: summary ? String(summary.overloaded_count) : "—",
      caption: "≥ 100% allocated",
      icon: "alert",
      accent: "red",
    },
    {
      id: "matches",
      label: "Suggested Matches",
      value: summary ? String(summary.suggested_matches_count) : "—",
      caption: "unassigned open tasks",
      icon: "sparkles",
      accent: "violet",
    },
  ]
}

export type ResourceRow = {
  id: string
  name: string
  initials: string
  color: AvatarColor
  skills: string[]
  billable: boolean
  /** Display rate (`120/hr`, or via `formatRate`). */
  rate: string
  /** Raw hourly bill rate (rounded), `null` when unset — format it yourself to localise. */
  rateValue: number | null
  availabilityPct: number | null
}

/** Per-employee average allocation across the heatmap period. */
function allocationByEmployee(heatmap: ResourceHeatmapRow[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of heatmap) {
    if (!row.weeks.length) continue
    const avg =
      row.weeks.reduce((a, w) => a + w.allocation_pct, 0) / row.weeks.length
    map.set(row.employee_id, Math.round(avg))
  }
  return map
}

export function buildResourceDirectory(
  pool: ResourcePoolItem[],
  heatmap: ResourceHeatmapRow[] = [],
  /** Formats a rounded hourly rate, e.g. `(rate) => t("ratePerHour", { rate })`. */
  formatRate: (rate: number) => string = (rate) => `${rate}/hr`,
): ResourceRow[] {
  const allocation = allocationByEmployee(heatmap)
  return pool.map((item) => {
    const name = `${item.first_name} ${item.last_name}`.trim()
    const rate =
      item.bill_rate == null ? null : Math.round(Number(item.bill_rate))
    return {
      id: item.employee_id,
      name,
      initials: initialsOf(name),
      color: avatarColorFor(item.employee_id),
      skills: item.pm_skills ?? [],
      billable: item.billable_default,
      rate: rate == null ? "—" : formatRate(rate),
      rateValue: rate,
      availabilityPct: allocation.get(item.employee_id) ?? null,
    }
  })
}

export type HeatmapView = {
  weeks: string[]
  rows: {
    id: string
    name: string
    initials: string
    color: AvatarColor
    cells: number[]
  }[]
}

export function buildHeatmapView(
  heatmap: ResourceHeatmapRow[] | undefined,
  /** `Intl` locale for the week column labels (`useIntlLocale()`). */
  locale = "en-US",
): HeatmapView {
  if (!heatmap || !heatmap.length) return { weeks: [], rows: [] }
  // Column labels come from the row with the most weeks (covers the full period).
  const widest = heatmap.reduce(
    (max, r) => (r.weeks.length > max.weeks.length ? r : max),
    heatmap[0],
  )
  const weeks = widest.weeks.map((w) => shortDate(w.week_start, locale))
  const rows = heatmap.map((r) => ({
    id: r.employee_id,
    name: r.name,
    initials: initialsOf(r.name),
    color: avatarColorFor(r.employee_id),
    cells: r.weeks.map((w) => Math.round(w.allocation_pct)),
  }))
  return { weeks, rows }
}
