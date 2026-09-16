// Shared display helpers for training categories and course delivery modes.
// Keeps badge styling consistent across the Programs and Course Catalog tabs and
// degrades gracefully for values the backend may add later.

/** Title-case a snake/kebab/space separated string, e.g. "soft_skills" → "Soft Skills". */
export function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const CATEGORY_CLASSNAMES: Record<string, string> = {
  technical: "bg-brand-info/10 text-brand-info",
  leadership: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  management: "bg-brand-primary/10 text-brand-primary",
  compliance: "bg-brand-warning/10 text-brand-warning",
  soft_skills: "bg-brand-success/10 text-brand-success",
}

export function categoryBadge(category: string): {
  label: string
  className: string
} {
  const key = category?.toLowerCase()
  return {
    label: humanize(category ?? "General"),
    className: CATEGORY_CLASSNAMES[key] ?? "bg-surface-hover text-content-tertiary",
  }
}

export type DeliveryIconKey = "online" | "hybrid" | "classroom"

export function deliveryFormat(mode: string): {
  label: string
  className: string
  icon: DeliveryIconKey
} {
  switch (mode?.toLowerCase()) {
    case "classroom":
      return {
        label: "Classroom",
        className: "bg-brand-warning/10 text-brand-warning",
        icon: "classroom",
      }
    case "blended":
    case "hybrid":
      return {
        label: "Hybrid",
        className: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
        icon: "hybrid",
      }
    case "e_learning":
    case "online":
    case "virtual":
    case "self_paced":
      return {
        label: mode?.toLowerCase() === "virtual" ? "Virtual" : "Online",
        className: "bg-brand-info/10 text-brand-info",
        icon: "online",
      }
    default:
      return {
        label: humanize(mode ?? "Online"),
        className: "bg-surface-hover text-content-tertiary",
        icon: "online",
      }
  }
}
