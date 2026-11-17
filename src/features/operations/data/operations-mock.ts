import type { Messages } from "next-intl"

import type { ProjectKpis, ProjectStatus } from "../lib/types/projects"
import type { TaskPriority, TaskStatus } from "../lib/types/tasks"
import type { VendorKpis, VendorStatus } from "../lib/types/vendors"

/**
 * Pure UI config for the Operations module — everything that used to live here as
 * hardcoded data (`PROJECTS`, `TASKS`, `VENDORS`, `PROJECT_OWNERS`, …) now comes from
 * `bruno/Operations` live endpoints via `lib/{api,queries,mutations}`. What remains
 * here is display-only styling/labels keyed by the real wire enums. Labels are message
 * keys (`OperationsProjects` / `OperationsTasks` / `OperationsVendors`); enum values render
 * through the nested `status` / `priority` maps, e.g. `t(\`status.${value}\`)`.
 */

export type OperationsTab = "projects" | "tasks" | "vendors"

export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  planning: "bg-[#f4f4f5] text-content-tertiary",
  active: "bg-brand-info/12 text-brand-info",
  on_hold: "bg-brand-warning/12 text-brand-warning",
  completed: "bg-brand-success/12 text-brand-success",
}

export type ProjectKpiAccent = "indigo" | "amber" | "red"

export type ProjectKpiTile = {
  key: keyof ProjectKpis
  labelKey: Extract<keyof Messages["OperationsProjects"], `kpi${string}`>
  icon: "grid" | "dollar" | "wallet" | "alert"
  accent: ProjectKpiAccent
  format: "count" | "currency"
}

export const PROJECT_KPI_TILES: ProjectKpiTile[] = [
  { key: "active_projects", labelKey: "kpiActiveProjects", icon: "grid", accent: "indigo", format: "count" },
  { key: "total_budget", labelKey: "kpiTotalBudget", icon: "dollar", accent: "indigo", format: "currency" },
  { key: "total_spent", labelKey: "kpiTotalSpent", icon: "wallet", accent: "amber", format: "currency" },
  { key: "overdue_tasks", labelKey: "kpiOverdueTasks", icon: "alert", accent: "red", format: "count" },
]

export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  to_do: "bg-[#a1a1aa]",
  in_progress: "bg-[#3b82f6]",
  review: "bg-brand-warning",
  done: "bg-brand-success",
  blocked: "bg-brand-danger",
}

export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-[#a1a1aa]",
  medium: "bg-[#3b82f6]",
  high: "bg-brand-warning",
  critical: "bg-brand-danger",
}

/** Rendered with `t(\`status.${value}\`)` in the `OperationsTasks` namespace. */
export const TASK_STATUS_OPTIONS: readonly TaskStatus[] = [
  "to_do",
  "in_progress",
  "review",
  "done",
  "blocked",
]

/** `"all"` renders with `Common.all`, the rest like `TASK_STATUS_OPTIONS`. */
export const TASK_FILTER_OPTIONS: readonly (TaskStatus | "all")[] = [
  "all",
  ...TASK_STATUS_OPTIONS,
]

/** Rendered with `t(\`priority.${value}\`)` in the `OperationsTasks` namespace. */
export const TASK_PRIORITY_OPTIONS: readonly TaskPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
]

export const VENDOR_STATUS_STYLE: Record<VendorStatus, string> = {
  active: "bg-brand-success/12 text-brand-success",
  pending: "bg-brand-warning/12 text-brand-warning",
  inactive: "bg-[#f4f4f5] text-content-tertiary",
}

export type VendorKpiAccent = "emerald" | "indigo" | "amber"

export type VendorKpiTile = {
  key: keyof VendorKpis
  labelKey: Extract<keyof Messages["OperationsVendors"], `kpi${string}`>
  icon: "vendors" | "dollar" | "clock"
  accent: VendorKpiAccent
  format: "count" | "currency"
}

export const VENDOR_KPI_TILES: VendorKpiTile[] = [
  { key: "active_vendors", labelKey: "kpiActiveVendors", icon: "vendors", accent: "emerald", format: "count" },
  { key: "monthly_vendor_spend", labelKey: "kpiMonthlySpend", icon: "dollar", accent: "indigo", format: "currency" },
  { key: "contracts_expiring_soon", labelKey: "kpiExpiringSoon", icon: "clock", accent: "amber", format: "count" },
]

/** `"all"` renders with `Common.all`, the rest with `t(\`status.${value}\`)` (`OperationsVendors`). */
export const VENDOR_FILTER_OPTIONS: readonly (VendorStatus | "all")[] = [
  "all",
  "active",
  "pending",
  "inactive",
]
