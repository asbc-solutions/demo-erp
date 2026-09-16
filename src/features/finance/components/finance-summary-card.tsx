import * as React from "react"
import {
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

type FinanceAccent = "emerald" | "amber" | "red" | "violet"
type SummaryIcon = "dollar" | "clock" | "alert" | "file"

const accentLeftBorder: Record<FinanceAccent, string> = {
  emerald: "border-l-[#00bc7d]",
  amber: "border-l-brand-warning",
  red: "border-l-[#fb2c36]",
  violet: "border-l-violet-500",
}

const accentTint: Record<FinanceAccent, string> = {
  emerald:
    "from-[rgba(0,188,125,0.05)] to-[rgba(0,153,102,0.05)]",
  amber: "from-[rgba(245,158,11,0.05)] to-[rgba(225,113,0,0.05)]",
  red: "from-[rgba(251,44,54,0.05)] to-[rgba(231,0,11,0.05)]",
  violet:
    "from-[rgba(139,92,246,0.05)] to-[rgba(127,34,254,0.05)]",
}

const accentIconBg: Record<FinanceAccent, string> = {
  emerald:
    "from-[rgba(16,185,129,0.2)] to-[rgba(16,185,129,0.05)] text-brand-success",
  amber:
    "from-[rgba(99,102,241,0.2)] to-[rgba(99,102,241,0.05)] text-brand-primary",
  red: "from-[rgba(239,68,68,0.2)] to-[rgba(239,68,68,0.05)] text-brand-danger",
  violet:
    "from-[rgba(139,92,246,0.15)] to-[rgba(139,92,246,0.03)] text-violet-600",
}

const ICONS: Record<SummaryIcon, LucideIcon> = {
  dollar: DollarSign,
  clock: Clock,
  alert: AlertTriangle,
  file: FileText,
}

type FinanceSummaryCardProps = {
  label: string
  value: React.ReactNode
  accent: FinanceAccent
  icon: SummaryIcon
  className?: string
}

export function FinanceSummaryCard({
  label,
  value,
  accent,
  icon,
  className,
}: FinanceSummaryCardProps) {
  const Icon = ICONS[icon]
  return (
    <Card
      variant="elevated"
      className={cn(
        "relative overflow-hidden rounded-2xl border-stroke-default border-l-[2.4px] py-6",
        accentLeftBorder[accent],
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100",
          accentTint[accent],
        )}
      />
      <div className="relative flex flex-col gap-2 px-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex rounded-lg bg-gradient-to-br p-1.5 [&_svg]:size-3.5",
              accentIconBg[accent],
            )}
          >
            <Icon />
          </span>
          <span className="text-[11px] leading-[15.4px] text-content-quaternary">
            {label}
          </span>
        </div>
        <p className="text-[25px] leading-[32.5px] font-semibold text-content-primary">
          {value}
        </p>
      </div>
    </Card>
  )
}

export type { FinanceAccent }
