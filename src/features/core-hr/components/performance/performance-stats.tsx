"use client"

import { Award, BarChart3, CheckCircle2, Target } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import { cn } from "@/src/shared/lib/utils/utils"

// ─── Accent tiles (icon backgrounds for the "hero" stat cards) ─────────────────

type StatAccent = "indigo" | "violet" | "blue" | "emerald" | "amber"

const accentTile: Record<StatAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  blue: "bg-brand-info/10 text-brand-info",
  emerald: "bg-brand-success/10 text-brand-success",
  amber: "bg-brand-warning/15 text-brand-warning dark:bg-brand-warning/20",
}

// ─── Hero stat card (label + value on the left, icon tile on the right) ─────────
// Used by the Review Cycles / Team Reviews summary row.

type HeroStatCardProps = Readonly<{
  label: string
  value: React.ReactNode
  valueClassName?: string
  icon: React.ReactNode
  accent: StatAccent
  progress?: number
}>

function HeroStatCard({
  label,
  value,
  valueClassName,
  icon,
  accent,
  progress,
}: HeroStatCardProps) {
  return (
    <Card variant="elevated" className="gap-0 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm leading-5 text-content-tertiary">{label}</span>
          <span
            className={cn(
              "truncate text-2xl leading-8 font-bold text-content-primary",
              valueClassName,
            )}
          >
            {value}
          </span>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-5",
            accentTile[accent],
          )}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      {progress !== undefined && (
        <Progress value={progress} color="indigo" className="mt-3" />
      )}
    </Card>
  )
}

// ─── Summary stat card (label + icon on top, big value, hint below) ─────────────
// Used by the Goals & OKRs / 360 Feedback summary rows.

type SummaryStatCardProps = Readonly<{
  label: string
  value: React.ReactNode
  valueClassName?: string
  hint: React.ReactNode
  icon: React.ReactNode
  iconClassName?: string
}>

function SummaryStatCard({
  label,
  value,
  valueClassName,
  hint,
  icon,
  iconClassName,
}: SummaryStatCardProps) {
  return (
    <Card variant="elevated" className="gap-0 p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm leading-5 font-medium text-content-secondary">
          {label}
        </span>
        <span className={cn("shrink-0 [&_svg]:size-4", iconClassName)} aria-hidden>
          {icon}
        </span>
      </div>
      <span
        className={cn(
          "mt-4 text-2xl leading-8 font-bold text-content-primary",
          valueClassName,
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-xs leading-4 text-content-tertiary">{hint}</span>
    </Card>
  )
}

// ─── Shared summary row for Review Cycles + Team Reviews ─────────────────────────

function ReviewCycleKpis() {
  const t = useTranslations("HrPerformance")

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HeroStatCard
        label={t("kpiActiveCycle")}
        value={t("annualCycle", { year: 2026 })}
        valueClassName="text-lg leading-7"
        icon={<Target strokeWidth={1.75} />}
        accent="violet"
      />
      <HeroStatCard
        label={t("overallProgress")}
        value={t("percent", { percent: 52 })}
        icon={<BarChart3 strokeWidth={1.75} />}
        accent="blue"
        progress={52}
      />
      <HeroStatCard
        label={t("kpiReviewsSubmitted")}
        value={
          <>
            6
            <span className="text-lg font-normal text-content-tertiary">/10</span>
          </>
        }
        icon={<CheckCircle2 strokeWidth={1.75} />}
        accent="emerald"
      />
      <HeroStatCard
        label={t("kpiActionFlags")}
        value="2"
        icon={<Award strokeWidth={1.75} />}
        accent="amber"
      />
    </div>
  )
}

export { HeroStatCard, SummaryStatCard, ReviewCycleKpis }
export type { StatAccent }
