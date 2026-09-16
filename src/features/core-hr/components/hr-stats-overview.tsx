import { Briefcase, Building2, CalendarDays, Users, type LucideIcon } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

type StatTone = "indigo" | "amber" | "emerald" | "violet"

const TONE_CLASSES: Record<StatTone, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  amber: "bg-brand-warning/10 text-brand-warning",
  emerald: "bg-brand-success/10 text-brand-success",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

type HrStatsOverviewProps = Readonly<{
  totalHeadcount?: number
  openPositions?: number
  avgTenureYears?: number
  departmentCount?: number
  isLoading?: boolean
}>

type StatItem = {
  id: string
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone: StatTone
}

export function HrStatsOverview({
  totalHeadcount = 0,
  openPositions = 0,
  avgTenureYears = 0,
  departmentCount = 0,
  isLoading = false,
}: HrStatsOverviewProps) {
  const stats: StatItem[] = [
    {
      id: "headcount",
      label: "Total Headcount",
      value: isLoading ? "—" : totalHeadcount,
      icon: Users,
      tone: "indigo",
    },
    {
      id: "open",
      label: "Open Positions",
      value: isLoading ? "—" : openPositions,
      icon: Briefcase,
      tone: "amber",
    },
    {
      id: "tenure",
      label: "Avg. Tenure",
      value: isLoading ? (
        "—"
      ) : (
        <span className="flex items-baseline gap-1">
          <span>{avgTenureYears.toFixed(1)}</span>
          <span className="text-content-quaternary text-[11px] leading-[15.4px] font-normal">
            years
          </span>
        </span>
      ),
      icon: CalendarDays,
      tone: "emerald",
    },
    {
      id: "departments",
      label: "Departments",
      value: isLoading ? "—" : departmentCount,
      icon: Building2,
      tone: "violet",
    },
  ]

  return (
    <Card className="border-stroke-default bg-surface-white w-full rounded-[16px] px-5 py-11 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
        {stats.map(({ id, label, value, icon: Icon, tone }) => (
          <div key={id} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-[12px]",
                TONE_CLASSES[tone],
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col">
              <span className="text-content-quaternary text-[11px] leading-[15.4px] font-normal">
                {label}
              </span>
              <span className="text-content-primary text-xl leading-7 font-semibold">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
