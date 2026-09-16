import type { AvatarTone } from "../../types/employee"

export const AVATAR_TONE_CLASSES: Record<AvatarTone, string> = {
  indigo: "bg-brand-primary/15 text-brand-primary",
  amber: "bg-brand-warning/15 text-brand-warning",
  emerald: "bg-brand-success/15 text-brand-success",
  rose: "bg-brand-danger/15 text-brand-danger",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
}
