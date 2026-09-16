import type { ProjectKpis, ProjectStatus } from "../lib/types/projects"
import type { TaskPriority, TaskStatus } from "../lib/types/tasks"
import type { VendorKpis, VendorStatus } from "../lib/types/vendors"

/**
 * Pure UI config for the Operations module — everything that used to live here as
 * hardcoded data (`PROJECTS`, `TASKS`, `VENDORS`, `PROJECT_OWNERS`, …) now comes from
 * `bruno/Operations` live endpoints via `lib/{api,queries,mutations}`. What remains
 * here is display-only styling/labels keyed by the real wire enums.
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
  label: string
  icon: "grid" | "dollar" | "wallet" | "alert"
  accent: ProjectKpiAccent
  format: "count" | "currency"
}

export const PROJECT_KPI_TILES: ProjectKpiTile[] = [
  { key: "active_projects", label: "Active Projects", icon: "grid", accent: "indigo", format: "count" },
  { key: "total_budget", label: "Total Budget", icon: "dollar", accent: "indigo", format: "currency" },
  { key: "total_spent", label: "Total Spent", icon: "wallet", accent: "amber", format: "currency" },
  { key: "overdue_tasks", label: "Overdue Tasks", icon: "alert", accent: "red", format: "count" },
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

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "to_do", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
]

export const TASK_FILTER_OPTIONS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...TASK_STATUS_OPTIONS,
]

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

export const VENDOR_STATUS_STYLE: Record<VendorStatus, string> = {
  active: "bg-brand-success/12 text-brand-success",
  pending: "bg-brand-warning/12 text-brand-warning",
  inactive: "bg-[#f4f4f5] text-content-tertiary",
}

export type VendorKpiAccent = "emerald" | "indigo" | "amber"

export type VendorKpiTile = {
  key: keyof VendorKpis
  label: string
  icon: "vendors" | "dollar" | "clock"
  accent: VendorKpiAccent
  format: "count" | "currency"
}

export const VENDOR_KPI_TILES: VendorKpiTile[] = [
  { key: "active_vendors", label: "Active Vendors", icon: "vendors", accent: "emerald", format: "count" },
  { key: "monthly_vendor_spend", label: "Monthly Vendor Spend", icon: "dollar", accent: "indigo", format: "currency" },
  { key: "contracts_expiring_soon", label: "Contracts Expiring Soon", icon: "clock", accent: "amber", format: "count" },
]

export const VENDOR_FILTER_OPTIONS: { value: VendorStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
]
