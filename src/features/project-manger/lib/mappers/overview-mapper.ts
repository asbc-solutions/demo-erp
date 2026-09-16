import type {
  AvatarColor,
  ProgressColor,
} from "../../all-project/data/all-projects-data"
import type {
  HealthState,
  MilestoneKind,
  PhaseState,
} from "../../all-project/data/project-detail-data"
import type {
  EvmMetrics,
  Milestone,
  NodeCost,
  ProjectUtilizationRow,
  Task,
  Timeline,
} from "../types"
import { formatMoney } from "./cost-budget-mapper"
import { formatApiDate, initialsFromName } from "./project-mapper"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function flattenTasks(timelines: Timeline[]): Task[] {
  const out: Task[] = []
  for (const timeline of timelines)
    for (const phase of timeline.phases ?? [])
      for (const task of phase.tasks ?? []) out.push(task)
  return out
}

/** Whole days from now until `date` (clamped at 0). null if unparseable. */
function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  const target = new Date(date)
  if (Number.isNaN(target.getTime())) return null
  return Math.max(0, Math.round((target.getTime() - Date.now()) / 86_400_000))
}

/* ------------------------------------------------------------------ */
/* Project progress + phase timeline                                  */
/* ------------------------------------------------------------------ */

const PHASE_STATE: Record<string, PhaseState> = {
  completed: "done",
  done: "done",
  active: "active",
  in_progress: "active",
}

export type OverviewProgress = {
  percent: number
  tasksDone: number
  tasksTotal: number
  daysRemaining: number | null
  phases: { name: string; state: PhaseState }[]
}

export function buildOverviewProgress(
  timelines: Timeline[],
  endDate: string | null | undefined,
): OverviewProgress {
  const tasks = flattenTasks(timelines)
  const tasksTotal = tasks.length
  const tasksDone = tasks.filter((t) => t.status === "done").length
  const percent =
    tasksTotal === 0
      ? 0
      : Math.round(
          tasks.reduce((a, t) => a + (Number(t.percent_complete) || 0), 0) /
            tasksTotal,
        )

  const phases = timelines
    .flatMap((t) => t.phases ?? [])
    .map((p) => ({ name: p.name, state: PHASE_STATE[p.status] ?? "todo" }))

  return { percent, tasksDone, tasksTotal, daysRemaining: daysUntil(endDate), phases }
}

/* ------------------------------------------------------------------ */
/* Stat tiles                                                          */
/* ------------------------------------------------------------------ */

export type OverviewStat = {
  id: string
  label: string
  value: string
  caption: string
}

export function buildOverviewStats(args: {
  nodeCost: NodeCost | undefined
  evm: EvmMetrics | undefined
  progress: OverviewProgress
}): OverviewStat[] {
  const { nodeCost, evm, progress } = args
  const stats: OverviewStat[] = []

  if (nodeCost) {
    const spent = nodeCost.committed + nodeCost.actual
    stats.push({
      id: "budget",
      label: "Budget Consumed",
      value: formatMoney(spent),
      caption: `of ${formatMoney(nodeCost.planned)}`,
    })
  }

  stats.push({
    id: "tasks",
    label: "Tasks Completed",
    value: String(progress.tasksDone),
    caption: `of ${progress.tasksTotal}`,
  })

  stats.push({
    id: "days",
    label: "Days Remaining",
    value: progress.daysRemaining == null ? "—" : String(progress.daysRemaining),
    caption: progress.daysRemaining == null ? "no end date" : "until completion",
  })

  if (evm) {
    stats.push({
      id: "cpi",
      label: "Cost Performance",
      value: evm.cpi == null ? "—" : evm.cpi.toFixed(2),
      caption: "CPI",
    })
  }

  return stats
}

/* ------------------------------------------------------------------ */
/* Health summary (from earned-value)                                  */
/* ------------------------------------------------------------------ */

export type HealthItem = {
  label: string
  state: HealthState
  value: number
  color: ProgressColor
}

const HEALTH_COLOR: Record<HealthState, ProgressColor> = {
  "On Track": "emerald",
  "At Risk": "amber",
  Critical: "red",
}

/** An index ≥1 is healthy; 0.9–1 at risk; below 0.9 critical. */
function indexHealth(label: string, v: number | null | undefined): HealthItem | null {
  if (v == null || Number.isNaN(v)) return null
  const state: HealthState = v >= 1 ? "On Track" : v >= 0.9 ? "At Risk" : "Critical"
  return {
    label,
    state,
    value: Math.max(0, Math.min(100, Math.round(v * 100))),
    color: HEALTH_COLOR[state],
  }
}

export function buildHealthSummary(
  evm: EvmMetrics | undefined,
  nodeCost: NodeCost | undefined,
): HealthItem[] {
  const items: HealthItem[] = []

  if (evm) {
    const cost = indexHealth("Cost Health", evm.cpi)
    if (cost) items.push(cost)
    const schedule = indexHealth("Schedule Health", evm.spi)
    if (schedule) items.push(schedule)
  }

  if (nodeCost && nodeCost.planned > 0) {
    const consumed = ((nodeCost.committed + nodeCost.actual) / nodeCost.planned) * 100
    const state: HealthState =
      consumed <= 90 ? "On Track" : consumed <= 100 ? "At Risk" : "Critical"
    items.push({
      label: "Budget Health",
      state,
      // The bar shows remaining budget, so a fuller bar reads as healthier.
      value: Math.max(0, Math.min(100, Math.round(100 - consumed))),
      color: HEALTH_COLOR[state],
    })
  }

  return items
}

/* ------------------------------------------------------------------ */
/* Upcoming milestones                                                 */
/* ------------------------------------------------------------------ */

export type UpcomingMilestone = {
  id: string
  title: string
  date: string
  meta: string
  kind: MilestoneKind
}

export function buildUpcomingMilestones(
  milestones: Milestone[],
): UpcomingMilestone[] {
  return milestones
    .filter((m) => m.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
    )
    .slice(0, 5)
    .map((m) => {
      const days = daysUntil(m.target_date)
      const when = days == null ? m.type_label : `in ${days} days · ${m.type_label}`
      return {
        id: m.id,
        title: m.name,
        date: formatApiDate(m.target_date),
        meta: when,
        kind: m.type,
      }
    })
}

/* ------------------------------------------------------------------ */
/* Team (project utilization)                                          */
/* ------------------------------------------------------------------ */

export type TeamMember = {
  id: string
  name: string
  initials: string
  color: AvatarColor
  caption: string
}

const AVATAR_COLORS: AvatarColor[] = [
  "primary",
  "info",
  "success",
  "danger",
  "warning",
]

export function buildTeam(rows: ProjectUtilizationRow[]): TeamMember[] {
  return rows.map((row, i) => ({
    id: row.employee_id,
    name: row.name,
    initials: initialsFromName(row.name),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    caption: `${Math.round(row.total_allocation_pct)}% allocated · ${
      row.assignment_count
    } task${row.assignment_count === 1 ? "" : "s"}`,
  }))
}
