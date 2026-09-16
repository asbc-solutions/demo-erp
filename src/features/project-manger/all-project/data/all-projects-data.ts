import type { ProjectLifecycleStatus } from "../../lib/types"

/** Mirrors the `color` prop of the `Progress` primitive. */
export type ProgressColor =
  | "indigo"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "violet"

/** Mirrors the `color` prop of the `Avatar` primitive. */
export type AvatarColor =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"

/* ------------------------------------------------------------------ */
/* Lifecycle status (backend) — created → released → … → closed        */
/* ------------------------------------------------------------------ */

/** Badge styling keyed to the backend project lifecycle status. */
export const LIFECYCLE_STATUS_STYLE: Record<
  ProjectLifecycleStatus,
  { badge: string; dot: string }
> = {
  created: {
    badge: "bg-surface-muted text-content-tertiary",
    dot: "bg-content-tertiary",
  },
  released: {
    badge: "bg-brand-success/12 text-brand-success",
    dot: "bg-brand-success",
  },
  technically_complete: {
    badge: "bg-brand-info/12 text-brand-info",
    dot: "bg-brand-info",
  },
  closed: {
    badge: "bg-brand-primary/12 text-brand-primary",
    dot: "bg-brand-primary",
  },
}

/** Top accent border for the grid card, derived from the progress colour. */
export const ACCENT_BORDER_TOP: Record<ProgressColor, string> = {
  indigo: "border-t-brand-primary",
  amber: "border-t-brand-warning",
  red: "border-t-brand-danger",
  emerald: "border-t-brand-success",
  blue: "border-t-brand-info",
  violet: "border-t-violet-500",
}

/* ------------------------------------------------------------------ */
/* Type tag                                                            */
/* ------------------------------------------------------------------ */

export type ProjectType =
  | "External"
  | "Internal"
  | "CAPEX"
  | "Overhead"
  | "R&D"
  | "Compliance"

export const TYPE_STYLE: Record<ProjectType, string> = {
  External: "text-brand-primary",
  Internal: "text-brand-info",
  CAPEX: "text-brand-warning",
  Overhead: "text-content-tertiary",
  "R&D": "text-brand-info",
  Compliance: "text-brand-success",
}
