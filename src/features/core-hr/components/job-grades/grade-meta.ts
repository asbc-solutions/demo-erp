import type { GradeCategory } from "../../lib/types"

export const CATEGORY_LABEL: Record<GradeCategory, string> = {
  executive: "Executive",
  management: "Management",
  professional: "Professional",
  technical: "Technical",
  administrative: "Administrative",
  operational: "Operational",
}

export const CATEGORY_BADGE: Record<GradeCategory, string> = {
  executive: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  management: "bg-brand-primary/10 text-brand-primary",
  professional: "bg-brand-success/10 text-brand-success",
  technical: "bg-brand-warning/10 text-brand-warning",
  administrative: "bg-surface-hover text-content-secondary",
  operational: "bg-surface-hover text-content-secondary",
}

/** Compact thousands formatting, e.g. 80000 → "80K". */
export const formatK = (value: number) =>
  value >= 1_000 ? `${Math.round(value / 1000)}K` : String(value)

/** Full money formatting, e.g. (8000, "EGP") → "EGP 8,000". */
export const formatMoney = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString("en-US")}`
