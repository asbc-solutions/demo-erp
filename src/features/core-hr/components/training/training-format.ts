// Shared display helpers for training categories and course delivery modes.
// Keeps badge styling consistent across the Programs and Course Catalog tabs and
// degrades gracefully for values the backend may add later.

import type { useTranslations } from "next-intl"

type TrainingTranslator = ReturnType<typeof useTranslations<"HrTraining">>

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

const KNOWN_CATEGORIES = [
  "technical",
  "leadership",
  "management",
  "compliance",
  "soft_skills",
  "development",
  "engineering",
] as const

type KnownCategory = (typeof KNOWN_CATEGORIES)[number]

function isKnownCategory(value: string): value is KnownCategory {
  return (KNOWN_CATEGORIES as readonly string[]).includes(value)
}

/** Localised label for a programme/course category; unknown backend values are humanised. */
export function categoryLabel(category: string, t: TrainingTranslator): string {
  if (!category) return t("category.general")
  const key = category.toLowerCase()
  return isKnownCategory(key) ? t(`category.${key}`) : humanize(category)
}

export function categoryBadge(
  category: string,
  t: TrainingTranslator,
): {
  label: string
  className: string
} {
  const key = category?.toLowerCase()
  return {
    label: categoryLabel(category, t),
    className: CATEGORY_CLASSNAMES[key] ?? "bg-surface-hover text-content-tertiary",
  }
}

export type DeliveryIconKey = "online" | "hybrid" | "classroom"

export function deliveryFormat(
  mode: string,
  t: TrainingTranslator,
): {
  label: string
  className: string
  icon: DeliveryIconKey
} {
  switch (mode?.toLowerCase()) {
    case "classroom":
      return {
        label: t("delivery.classroom"),
        className: "bg-brand-warning/10 text-brand-warning",
        icon: "classroom",
      }
    case "blended":
    case "hybrid":
      return {
        label: t("delivery.hybrid"),
        className: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
        icon: "hybrid",
      }
    case "e_learning":
    case "online":
    case "virtual":
    case "self_paced":
      return {
        label:
          mode?.toLowerCase() === "virtual"
            ? t("delivery.virtual")
            : t("delivery.online"),
        className: "bg-brand-info/10 text-brand-info",
        icon: "online",
      }
    default:
      return {
        label: mode ? humanize(mode) : t("delivery.online"),
        className: "bg-surface-hover text-content-tertiary",
        icon: "online",
      }
  }
}
