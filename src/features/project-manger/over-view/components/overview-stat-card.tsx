import {
  CheckCircle2,
  Clock,
  Flag,
  FolderOpen,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

export type OverviewStatAccent = "indigo" | "amber" | "emerald" | "red"

export type OverviewStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "folder" | "check" | "clock" | "flag"
  accent: OverviewStatAccent
}

const ICON_MAP: Record<OverviewStat["icon"], LucideIcon> = {
  folder: FolderOpen,
  check: CheckCircle2,
  clock: Clock,
  flag: Flag,
}

const ACCENT_BORDER: Record<OverviewStatAccent, string> = {
  indigo: "border-s-brand-primary",
  amber: "border-s-brand-warning",
  emerald: "border-s-brand-success",
  red: "border-s-brand-danger",
}

const ACCENT_TILE: Record<OverviewStatAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  amber: "bg-brand-warning/10 text-brand-warning",
  emerald: "bg-brand-success/10 text-brand-success",
  red: "bg-brand-danger/10 text-brand-danger",
}

export function OverviewStatCard({ stat }: { stat: OverviewStat }) {
  const Icon = ICON_MAP[stat.icon]
  return (
    <Card
      variant="elevated"
      className={cn(
        "flex-row items-center gap-3 border-s-4 p-4",
        ACCENT_BORDER[stat.accent],
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          ACCENT_TILE[stat.accent],
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-content-tertiary text-[11px] leading-[17px] font-medium tracking-wide uppercase">
          {stat.label}
        </span>
        <span className="text-content-primary text-xl leading-[25px] font-bold tabular-nums">
          {stat.value}
        </span>
        <span className="text-content-tertiary text-[12px] leading-[17px]">
          {stat.caption}
        </span>
      </div>
    </Card>
  )
}
