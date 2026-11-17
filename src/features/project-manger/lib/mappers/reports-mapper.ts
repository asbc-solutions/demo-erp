import type { ProgressColor } from "../../all-project/data/all-projects-data"
import type { ProjectListItem, ProjectType } from "../types"

/* ------------------------------------------------------------------ */
/* Portfolio KPIs (counts derived from GET /projects)                  */
/* ------------------------------------------------------------------ */

export type ReportKpiId = "total" | "active" | "completed" | "external"

/** Translate `id` at render (`ProjectsProjectDetail.reportKpi`). */
export type ReportKpi = { id: ReportKpiId; value: string }

export function buildReportKpis(projects: ProjectListItem[]): ReportKpi[] {
  const total = projects.length
  const active = projects.filter((p) => p.status === "released").length
  const completed = projects.filter(
    (p) => p.status === "technically_complete" || p.status === "closed",
  ).length
  const external = projects.filter((p) => p.project_type === "external").length

  return [
    { id: "total", value: String(total) },
    { id: "active", value: String(active) },
    { id: "completed", value: String(completed) },
    { id: "external", value: String(external) },
  ]
}

/* ------------------------------------------------------------------ */
/* Portfolio breakdown by project type                                 */
/* ------------------------------------------------------------------ */

export type PortfolioTypeRow = {
  /** Translate at render (`ProjectsShared.projectType`). */
  type: ProjectType
  projects: number
  sharePct: number
  color: ProgressColor
}

const TYPE_COLOR: Record<ProjectType, ProgressColor> = {
  internal: "indigo",
  external: "emerald",
  capital: "blue",
  overhead: "amber",
}

export function buildPortfolioByType(
  projects: ProjectListItem[],
): PortfolioTypeRow[] {
  const total = projects.length || 1
  const counts = new Map<ProjectType, number>()
  for (const p of projects)
    counts.set(p.project_type, (counts.get(p.project_type) ?? 0) + 1)

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => ({
      type,
      projects: n,
      sharePct: Math.round((n / total) * 100),
      color: TYPE_COLOR[type] ?? "indigo",
    }))
}
