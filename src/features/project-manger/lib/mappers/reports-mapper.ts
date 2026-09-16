import type { ProgressColor } from "../../all-project/data/all-projects-data"
import type { ProjectListItem, ProjectType } from "../types"
import { PROJECT_TYPE_LABEL } from "./project-mapper"

/* ------------------------------------------------------------------ */
/* Portfolio KPIs (counts derived from GET /projects)                  */
/* ------------------------------------------------------------------ */

export type ReportKpi = { id: string; label: string; value: string }

export function buildReportKpis(projects: ProjectListItem[]): ReportKpi[] {
  const total = projects.length
  const active = projects.filter((p) => p.status === "released").length
  const completed = projects.filter(
    (p) => p.status === "technically_complete" || p.status === "closed",
  ).length
  const external = projects.filter((p) => p.project_type === "external").length

  return [
    { id: "total", label: "Total Projects", value: String(total) },
    { id: "active", label: "Active", value: String(active) },
    { id: "completed", label: "Completed", value: String(completed) },
    { id: "external", label: "External", value: String(external) },
  ]
}

/* ------------------------------------------------------------------ */
/* Portfolio breakdown by project type                                 */
/* ------------------------------------------------------------------ */

export type PortfolioTypeRow = {
  type: string
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
      type: PROJECT_TYPE_LABEL[type] ?? type,
      projects: n,
      sharePct: Math.round((n / total) * 100),
      color: TYPE_COLOR[type] ?? "indigo",
    }))
}
