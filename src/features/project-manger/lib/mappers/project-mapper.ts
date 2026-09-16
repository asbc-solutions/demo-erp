import type { HealthStatus, ProjectListItem, ProjectType } from "../types"
import { formatMoney } from "./cost-budget-mapper"

/* ------------------------------------------------------------------ */
/* Display labels                                                      */
/* ------------------------------------------------------------------ */

/** Backend `project_type` → label used by the grid/table `TYPE_STYLE` map. */
export type ProjectTypeLabel = "Internal" | "External" | "CAPEX" | "Overhead"

export const PROJECT_TYPE_LABEL: Record<ProjectType, ProjectTypeLabel> = {
  internal: "Internal",
  external: "External",
  capital: "CAPEX",
  overhead: "Overhead",
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** `2026-07-01` → `Jul 1, 2026`. Returns the raw string if unparseable. */
export function formatApiDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Best-effort initials from a free-text name. */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/* ------------------------------------------------------------------ */
/* View model — list / grid / table                                   */
/* ------------------------------------------------------------------ */

/**
 * Presentation row consumed by the grid card, table, and active-projects card.
 * Aggregate fields stay optional so the UI renders `—` when the backend omits
 * them (e.g. older responses without the card aggregates).
 */
export type ProjectRow = {
  id: string
  name: string
  code: string
  type: ProjectType
  typeLabel: ProjectTypeLabel
  /** Lifecycle status from the backend (created/released/…). */
  status: ProjectListItem["status"]
  statusLabel: string
  startDate: string
  endDate: string
  isActive: boolean
  managerId: string | null

  // ── card aggregates from the enriched list row ─────────────────────────
  org?: string
  progress?: number
  budget?: string
  manager?: { name: string; initials: string }
  phases?: number
  tasksDone?: number
  tasksTotal?: number
  health?: HealthStatus
}

export function mapProjectRow(item: ProjectListItem): ProjectRow {
  return {
    id: item.id,
    name: item.name,
    code: item.project_code,
    type: item.project_type,
    typeLabel: PROJECT_TYPE_LABEL[item.project_type] ?? "Internal",
    status: item.status,
    statusLabel: item.status_label,
    startDate: formatApiDate(item.start_date),
    endDate: formatApiDate(item.end_date),
    isActive: item.is_active,
    managerId: item.manager_id,

    progress: item.progress ?? undefined,
    budget:
      item.budget_amount != null ? formatMoney(item.budget_amount) : undefined,
    manager: item.manager_name
      ? {
          name: item.manager_name,
          initials: initialsFromName(item.manager_name),
        }
      : undefined,
    phases: item.phases_count ?? undefined,
    tasksDone: item.tasks_done ?? undefined,
    tasksTotal: item.tasks_total ?? undefined,
    health: item.health_status ?? undefined,
  }
}
