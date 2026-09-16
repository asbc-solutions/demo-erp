import {
  AlertTriangle,
  Clock,
  FolderOpen,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

export type StatAccent = "indigo" | "emerald" | "amber" | "red"

export type ProjectStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "folder" | "zap" | "alert" | "clock"
  accent: StatAccent
}

const ICON_MAP: Record<ProjectStat["icon"], LucideIcon> = {
  folder: FolderOpen,
  zap: Zap,
  alert: AlertTriangle,
  clock: Clock,
}

const ACCENT_BORDER: Record<StatAccent, string> = {
  indigo: "border-l-brand-primary",
  amber: "border-l-brand-warning",
  emerald: "border-l-brand-success",
  red: "border-l-brand-danger",
}

const ACCENT_TILE: Record<StatAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  amber: "bg-brand-warning/10 text-brand-warning",
  emerald: "bg-brand-success/10 text-brand-success",
  red: "bg-brand-danger/10 text-brand-danger",
}

export function AllProjectsStatCard({ stat }: { stat: ProjectStat }) {
  const Icon = ICON_MAP[stat.icon]
  return (
    <Card
      variant="elevated"
      className={cn(
        "flex-row items-center gap-3 border-l-4 p-4",
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
