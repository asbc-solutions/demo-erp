import type { AvatarColor, ProgressColor } from "../../all-project/data/all-projects-data"
import type { GanttRow } from "../../all-project/data/project-detail-data"
import type { CriticalPath, Milestone, Phase, Timeline } from "../types"

/* ------------------------------------------------------------------ */
/* Output model                                                        */
/* ------------------------------------------------------------------ */

export type GanttModel = {
  rows: GanttRow[]
  totalWeeks: number
  /** 1-based week index of `today`, or `null` when out of the project window. */
  todayWeek: number | null
  /** Top header bands, one per calendar month spanned by the timeline. */
  months: { label: string; weeks: number }[]
}

const DAY = 86_400_000
const WEEK = 7 * DAY
const UNKNOWN_OWNER = { initials: "?", color: "neutral" as AvatarColor }

function parse(date: string | null | undefined): number | null {
  if (!date) return null
  const ms = Date.parse(`${date}T00:00:00`)
  return Number.isNaN(ms) ? null : ms
}

function min(values: (number | null)[]): number | null {
  const real = values.filter((v): v is number => v != null)
  return real.length ? Math.min(...real) : null
}

function max(values: (number | null)[]): number | null {
  const real = values.filter((v): v is number => v != null)
  return real.length ? Math.max(...real) : null
}

/** Phase dates fall back to the span of their tasks when not set explicitly. */
function phaseWindow(phase: Phase) {
  const taskStarts = (phase.tasks ?? []).map((t) => parse(t.start_date))
  const taskEnds = (phase.tasks ?? []).map((t) => parse(t.due_date))
  return {
    start: parse(phase.start_date) ?? min(taskStarts),
    end: parse(phase.end_date) ?? max(taskEnds),
  }
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

const MILESTONE_COLOR: Record<string, ProgressColor> = {
  billing: "amber",
  internal: "violet",
}

/* ------------------------------------------------------------------ */
/* Mapper                                                              */
/* ------------------------------------------------------------------ */

export function toGanttModel(
  timelines: Timeline[],
  milestones: Milestone[] = [],
  criticalPath?: CriticalPath,
  /** `Intl` locale for the month band labels (`useIntlLocale()`). */
  locale = "en-US",
  today: Date = new Date(),
): GanttModel {
  const monthFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  })
  const critical = new Set(
    (criticalPath?.tasks ?? []).filter((t) => t.is_critical).map((t) => t.task_id),
  )

  // 1. Establish the project window (origin = earliest dated point).
  const allStarts: (number | null)[] = []
  const allEnds: (number | null)[] = []
  for (const timeline of timelines) {
    for (const phase of timeline.phases ?? []) {
      const w = phaseWindow(phase)
      allStarts.push(w.start)
      allEnds.push(w.end)
      for (const task of phase.tasks ?? []) {
        allStarts.push(parse(task.start_date))
        allEnds.push(parse(task.due_date))
      }
    }
  }
  for (const m of milestones) allStarts.push(parse(m.target_date))

  const origin = min(allStarts)
  if (origin == null) {
    return { rows: [], totalWeeks: 0, todayWeek: null, months: [] }
  }
  const lastDate = max([...allEnds, ...allStarts]) ?? origin

  const weekOf = (ms: number) => Math.floor((ms - origin) / WEEK) // 0-based
  const totalWeeks = Math.max(weekOf(lastDate) + 1, 1)

  const place = (start: number | null, end: number | null) => {
    if (start == null) return null
    const startWeek = weekOf(start) + 1
    const endWeek = end != null ? weekOf(end) + 1 : startWeek
    return { startWeek, span: Math.max(1, endWeek - startWeek + 1) }
  }

  // 2. Build rows: phase → its tasks → milestones (appended).
  const rows: GanttRow[] = []
  for (const timeline of timelines) {
    for (const phase of timeline.phases ?? []) {
      const w = phaseWindow(phase)
      const pos = place(w.start, w.end)
      if (pos) {
        rows.push({
          id: phase.id,
          name: phase.name,
          indent: false,
          owner: UNKNOWN_OWNER,
          percent: avg((phase.tasks ?? []).map((t) => t.percent_complete)),
          kind: "phase",
          startWeek: pos.startWeek,
          span: pos.span,
          color: "indigo",
        })
      }
      for (const task of phase.tasks ?? []) {
        const tpos = place(parse(task.start_date), parse(task.due_date))
        if (!tpos) continue
        const isCritical = critical.has(task.id)
        rows.push({
          id: task.id,
          name: task.title,
          indent: true,
          owner: UNKNOWN_OWNER,
          percent: task.percent_complete,
          kind: "task",
          startWeek: tpos.startWeek,
          span: tpos.span,
          color: isCritical ? "red" : "emerald",
          critical: isCritical,
        })
      }
    }
  }

  for (const m of milestones) {
    const at = parse(m.target_date)
    if (at == null) continue
    rows.push({
      id: m.id,
      name: m.name,
      indent: true,
      owner: UNKNOWN_OWNER,
      percent: m.status === "achieved" ? 100 : 0,
      kind: "milestone",
      startWeek: weekOf(at) + 1,
      span: 0,
      color: MILESTONE_COLOR[m.type] ?? "violet",
    })
  }

  // 3. Month bands across the timeline.
  const months: { label: string; weeks: number }[] = []
  for (let i = 0; i < totalWeeks; i++) {
    const d = new Date(origin + i * WEEK)
    const label = monthFormat.format(d)
    const last = months[months.length - 1]
    if (last && last.label === label) last.weeks += 1
    else months.push({ label, weeks: 1 })
  }

  // 4. Today marker.
  const todayMs = today.getTime()
  const todayWeek =
    todayMs >= origin && todayMs <= origin + totalWeeks * WEEK
      ? weekOf(todayMs) + 1
      : null

  return { rows, totalWeeks, todayWeek, months }
}
