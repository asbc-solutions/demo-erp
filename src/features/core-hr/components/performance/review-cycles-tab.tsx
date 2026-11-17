"use client"

import { Award, BarChart3, CheckCircle2, ChevronDown, Circle, Clock, Target } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import { useReviewCycles } from "../../lib/queries/performance"
import type { CycleStatus, ReviewCycle } from "../../lib/types"
import { HeroStatCard } from "./performance-stats"

// ─── Stage derivation ───────────────────────────────────────────────────────────

type StageStatus = "completed" | "in_progress" | "not_started"

type StageKey =
  | "goals"
  | "selfAssessment"
  | "managerReview"
  | "calibration"
  | "results"

interface ReviewStage {
  id: StageKey
  note?: string
  progress: number
  status: StageStatus
}

const STATUS_ORDER: CycleStatus[] = [
  "draft",
  "active",
  "self_review",
  "manager_review",
  "calibration",
  "completed",
  "closed",
  "archived",
]

/** Build the stage tracker from a review cycle's lifecycle status. */
function buildStages(status: CycleStatus): ReviewStage[] {
  const idx = STATUS_ORDER.indexOf(status)
  const stage = (completesAt: number, id: StageKey, note?: string): ReviewStage => {
    if (idx >= completesAt)
      return { id, note, progress: 100, status: "completed" }
    if (idx === completesAt - 1)
      return { id, note, progress: 50, status: "in_progress" }
    return { id, note, progress: 0, status: "not_started" }
  }
  return [
    stage(1, "goals"),
    stage(2, "selfAssessment"),
    stage(3, "managerReview"),
    stage(4, "calibration"),
    stage(5, "results"),
  ]
}

function overallProgress(status: CycleStatus): number {
  const idx = Math.min(Math.max(STATUS_ORDER.indexOf(status), 0), 5)
  return Math.round((idx / 5) * 100)
}

function fmtDate(intlLocale: string, iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(intlLocale, {
    month: "long",
    year: "numeric",
  })
}

// ─── Stage row ──────────────────────────────────────────────────────────────────

function StageIcon({ status }: Readonly<{ status: StageStatus }>) {
  if (status === "completed")
    return <CheckCircle2 className="size-5 text-brand-success" strokeWidth={1.75} />
  if (status === "in_progress")
    return <Clock className="size-5 text-brand-warning" strokeWidth={1.75} />
  return <Circle className="size-5 text-content-quaternary" strokeWidth={1.75} />
}

function StageRow({ stage }: Readonly<{ stage: ReviewStage }>) {
  const t = useTranslations("HrPerformance")
  const color = stage.progress > 0 ? "emerald" : "indigo"
  const pctColor =
    stage.progress > 0 ? "text-brand-success" : "text-content-quaternary"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <StageIcon status={stage.status} />
          <span className="text-sm leading-5 font-medium text-content-primary">
            {t(`stage.${stage.id}`)}
          </span>
          {stage.note && (
            <span className="text-xs leading-4 text-content-tertiary">
              {stage.note}
            </span>
          )}
        </div>
        <span className={cn("text-xs leading-4 font-medium tabular-nums", pctColor)}>
          {t("percent", { percent: stage.progress })}
        </span>
      </div>
      <Progress value={stage.progress} color={color} />
    </div>
  )
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

function ReviewCyclesKpis({ cycles }: Readonly<{ cycles: ReviewCycle[] }>) {
  const t = useTranslations("HrPerformance")
  const active =
    cycles.find(
      (cycle) =>
        !["completed", "closed", "archived"].includes(cycle.status),
    ) ?? cycles[0]
  const cycleName = active?.cycle_name ?? t("noActiveCycle")
  const progress = active ? overallProgress(active.status) : 0

  const completed = cycles.filter((cycle) =>
    ["completed", "closed", "archived"].includes(cycle.status),
  ).length
  const total = cycles.length
  const actionFlags = cycles.filter((cycle) =>
    ["draft", "calibration"].includes(cycle.status),
  ).length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HeroStatCard
        label={t("kpiActiveCycle")}
        value={cycleName}
        valueClassName="text-lg leading-7"
        icon={<Target strokeWidth={1.75} />}
        accent="violet"
      />
      <HeroStatCard
        label={t("overallProgress")}
        value={t("percent", { percent: progress })}
        icon={<BarChart3 strokeWidth={1.75} />}
        accent="blue"
        progress={progress}
      />
      <HeroStatCard
        label={t("kpiCompletedCycles")}
        value={
          <>
            {completed}
            <span className="text-lg font-normal text-content-tertiary">
              /{total}
            </span>
          </>
        }
        icon={<CheckCircle2 strokeWidth={1.75} />}
        accent="emerald"
      />
      <HeroStatCard
        label={t("kpiActionFlags")}
        value={actionFlags}
        icon={<Award strokeWidth={1.75} />}
        accent="amber"
      />
    </div>
  )
}

// ─── States ─────────────────────────────────────────────────────────────────────

function ReviewCyclesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-[14px]" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[14px]" />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReviewCyclesTab() {
  const t = useTranslations("HrPerformance")
  const intlLocale = useIntlLocale()
  const { data, isLoading, isError } = useReviewCycles({ per_page: 20 })

  if (isLoading) return <ReviewCyclesSkeleton />

  const cycles = data?.data ?? []
  const active =
    cycles.find(
      (cycle) =>
        !["completed", "closed", "archived"].includes(cycle.status),
    ) ?? cycles[0]

  const stages = active ? buildStages(active.status) : []
  const period = active
    ? [fmtDate(intlLocale, active.period_start), fmtDate(intlLocale, active.period_end)]
        .filter(Boolean)
        .join(" - ")
    : ""

  return (
    <div className="flex flex-col gap-6">
      <ReviewCyclesKpis cycles={cycles} />

      {isError ? (
        <Card
          variant="elevated"
          className="min-h-48 items-center justify-center p-6 text-center"
        >
          <span className="text-sm text-content-tertiary">
            {t("cyclesLoadError")}
          </span>
        </Card>
      ) : !active ? (
        <Card
          variant="elevated"
          className="min-h-48 items-center justify-center p-6 text-center"
        >
          <span className="text-sm text-content-tertiary">
            {t("cyclesEmpty")}
          </span>
        </Card>
      ) : (
        <Card variant="elevated" className="gap-0 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg leading-7 font-semibold text-content-primary">
                  {active.cycle_name ?? t("performanceReviewFallback")}
                </h3>
                <Badge variant="warning" className="gap-1">
                  <Clock className="size-3" strokeWidth={2} />
                  {t(`cyclePhase.${active.status}`)}
                </Badge>
              </div>
              {period && (
                <p className="text-sm leading-5 text-content-tertiary">
                  {t("period", { period })}
                </p>
              )}
            </div>

            <div className="text-end">
              <p className="text-sm leading-5 text-content-tertiary">
                {t("overallProgress")}
              </p>
              <p className="text-2xl leading-8 font-bold text-content-primary">
                {t("percent", { percent: overallProgress(active.status) })}
              </p>
            </div>
          </div>

          {/* Stages */}
          <div className="mt-6 flex flex-col">
            {stages.map((stage, i) => (
              <div key={stage.id}>
                <StageRow stage={stage} />
                {i < stages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ChevronDown
                      className="size-4 text-content-quaternary"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
