/**
 * The Expenses API returns free-form category color names (e.g. "indigo",
 * "slate" for the Uncategorized bucket — see Expense Breakdown.bru docs).
 * This maps those strings to a fixed, known palette so the UI never crashes
 * on an unrecognized value from the backend.
 */
export type FinanceAccentColor =
  | "indigo"
  | "amber"
  | "teal"
  | "red"
  | "violet"
  | "rose"
  | "orange"
  | "slate"

const KNOWN_COLORS: readonly FinanceAccentColor[] = [
  "indigo",
  "amber",
  "teal",
  "red",
  "violet",
  "rose",
  "orange",
  "slate",
]

export function resolveAccentColor(color: string | null | undefined): FinanceAccentColor {
  if (color && (KNOWN_COLORS as readonly string[]).includes(color)) {
    return color as FinanceAccentColor
  }
  return "slate"
}

export const ACCENT_BORDER: Record<FinanceAccentColor, string> = {
  indigo: "border-l-brand-primary",
  amber: "border-l-brand-warning",
  teal: "border-l-[#14b8a6]",
  red: "border-l-brand-danger",
  violet: "border-l-violet-500",
  rose: "border-l-rose-500",
  orange: "border-l-orange-500",
  slate: "border-l-content-quaternary",
}

export const ACCENT_TINT: Record<FinanceAccentColor, string> = {
  indigo: "from-brand-primary/[0.05] to-brand-primary/[0.02]",
  amber: "from-[rgba(245,158,11,0.06)] to-[rgba(245,158,11,0.02)]",
  teal: "from-[rgba(20,184,166,0.05)] to-[rgba(20,184,166,0.02)]",
  red: "from-brand-danger/[0.05] to-brand-danger/[0.02]",
  violet: "from-violet-500/[0.05] to-violet-500/[0.02]",
  rose: "from-rose-500/[0.06] to-rose-500/[0.02]",
  orange: "from-orange-500/[0.06] to-orange-500/[0.02]",
  slate: "from-[rgba(161,161,170,0.06)] to-[rgba(161,161,170,0.02)]",
}

export const ACCENT_ICON_BG: Record<FinanceAccentColor, string> = {
  indigo: "from-brand-primary/20 to-brand-primary/5 text-brand-primary",
  amber: "from-brand-warning/20 to-brand-warning/5 text-brand-warning",
  teal: "from-teal-500/20 to-teal-500/5 text-teal-600 dark:text-teal-400",
  red: "from-brand-danger/20 to-brand-danger/5 text-brand-danger",
  violet: "from-violet-500/20 to-violet-500/5 text-violet-500",
  rose: "from-rose-500/20 to-rose-500/5 text-rose-500",
  orange: "from-orange-500/20 to-orange-500/5 text-orange-500",
  slate: "from-content-quaternary/20 to-content-quaternary/5 text-content-tertiary",
}

export const ACCENT_DOT: Record<FinanceAccentColor, string> = {
  indigo: "bg-brand-primary",
  amber: "bg-brand-warning",
  teal: "bg-[#14b8a6]",
  red: "bg-brand-danger",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  slate: "bg-content-quaternary",
}

export const ACCENT_TEXT: Record<FinanceAccentColor, string> = {
  indigo: "text-brand-primary",
  amber: "text-brand-warning",
  teal: "text-teal-600 dark:text-teal-400",
  red: "text-brand-danger",
  violet: "text-violet-500",
  rose: "text-rose-500",
  orange: "text-orange-500",
  slate: "text-content-tertiary",
}

/** Raw hex for recharts `fill` — SVG chart colors, not Tailwind classes (see CLAUDE.md §2). */
export const ACCENT_PIE_COLOR: Record<FinanceAccentColor, string> = {
  indigo: "#6366f1",
  amber: "#f59e0b",
  teal: "#14b8a6",
  red: "#ef4444",
  violet: "#8b5cf6",
  rose: "#ec4899",
  orange: "#f97316",
  slate: "#a1a1aa",
}
