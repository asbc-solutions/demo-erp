import { cn } from "@/src/shared/lib/utils/utils"

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral"

/**
 * Tone by status key. Keys are normalised (lower-case, spaces/hyphens → `_`)
 * so a raw API value (`on_track`), a camelCase message key (`onTrack`) and an
 * English API label (`On Track`) all resolve the same way — the colour never
 * depends on the (possibly translated) display text.
 */
const STATUS_TONE: Record<string, StatusTone> = {
  on_track: "success",
  completed: "success",
  in_progress: "info",
  pending_approval: "warning",
  at_risk: "warning",
  critical: "danger",
  blocked: "danger",
  planned: "neutral",
}

const TONE_STYLE: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: "bg-brand-success/12 text-brand-success", dot: "bg-brand-success" },
  info: { badge: "bg-brand-info/12 text-brand-info", dot: "bg-brand-info" },
  warning: { badge: "bg-brand-warning/12 text-brand-warning", dot: "bg-brand-warning" },
  danger: { badge: "bg-brand-danger/12 text-brand-danger", dot: "bg-brand-danger" },
  neutral: { badge: "bg-surface-muted text-content-tertiary", dot: "bg-content-tertiary" },
}

function normaliseStatus(status: string): string {
  return status
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase()
}

/** Tone for a status key / raw API value / English API label. */
export function statusTone(status: string): StatusTone {
  return STATUS_TONE[normaliseStatus(status)] ?? "neutral"
}

export function StatusPill({
  status,
  label,
  tone,
  className,
}: {
  /**
   * Status key used to pick the tone: a raw API value (`on_track`), a message
   * key (`onTrack`) or an API `*_label`. Also the display text when `label`
   * is omitted.
   */
  status: string
  /** Display text (pass the translated label); defaults to `status`. */
  label?: string
  /** Explicit tone; overrides the one derived from `status`. */
  tone?: StatusTone
  className?: string
}) {
  const style = TONE_STYLE[tone ?? statusTone(status)]
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-[16.5px] font-medium whitespace-nowrap",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      {label ?? status}
    </span>
  )
}
