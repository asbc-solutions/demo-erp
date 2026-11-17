import {
  Activity,
  CircleCheckBig,
  FolderOpen,
  type LucideIcon,
  TrendingUp,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

export type MyProjectStatAccent = "indigo" | "emerald" | "blue"

export type MyProjectStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "folder" | "activity" | "trending" | "health"
  accent: MyProjectStatAccent
}

const ICON_MAP: Record<MyProjectStat["icon"], LucideIcon> = {
  folder: FolderOpen,
  activity: Activity,
  trending: TrendingUp,
  health: CircleCheckBig,
}

const ACCENT_BORDER: Record<MyProjectStatAccent, string> = {
  indigo: "border-s-brand-primary",
  emerald: "border-s-brand-success",
  blue: "border-s-brand-info",
}

const ACCENT_TILE: Record<MyProjectStatAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  emerald: "bg-brand-success/10 text-brand-success",
  blue: "bg-brand-info/10 text-brand-info",
}

export function MyProjectStatCard({ stat }: { stat: MyProjectStat }) {
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
