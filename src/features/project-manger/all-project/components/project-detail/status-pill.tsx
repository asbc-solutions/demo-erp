import { cn } from "@/src/shared/lib/utils/utils"

type Tone = "success" | "info" | "warning" | "danger" | "neutral"

const STATUS_TONE: Record<string, Tone> = {
  "On Track": "success",
  Completed: "success",
  "In Progress": "info",
  "Pending Approval": "warning",
  "At Risk": "warning",
  Critical: "danger",
  Blocked: "danger",
  Planned: "neutral",
}

const TONE_STYLE: Record<Tone, { badge: string; dot: string }> = {
  success: { badge: "bg-brand-success/12 text-brand-success", dot: "bg-brand-success" },
  info: { badge: "bg-brand-info/12 text-brand-info", dot: "bg-brand-info" },
  warning: { badge: "bg-brand-warning/12 text-brand-warning", dot: "bg-brand-warning" },
  danger: { badge: "bg-brand-danger/12 text-brand-danger", dot: "bg-brand-danger" },
  neutral: { badge: "bg-surface-muted text-content-tertiary", dot: "bg-content-tertiary" },
}

export function StatusPill({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const tone = STATUS_TONE[status] ?? "neutral"
  const style = TONE_STYLE[tone]
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-[16.5px] font-medium whitespace-nowrap",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      {status}
    </span>
  )
}
