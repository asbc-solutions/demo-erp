"use client"

import { AlertTriangle, Award, CheckCircle2, Target } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { useMyGoals } from "../../lib/queries/performance"
import type { Goal } from "../../lib/types"
import { SummaryStatCard } from "./performance-stats"

// ─── Derived status ─────────────────────────────────────────────────────────────

type KrStatus = "on_track" | "at_risk" | "completed"

const KR_STATUS_VARIANT: Record<KrStatus, "success" | "warning" | "info"> = {
  on_track: "success",
  at_risk: "warning",
  completed: "info",
}

/** Map a goal's status + progress onto the design's On Track / At Risk / Completed. */
function deriveKrStatus(goal: Goal): KrStatus {
  if (goal.status === "completed" || (goal.progress_pct ?? 0) >= 100)
    return "completed"
  if ((goal.progress_pct ?? 0) >= 60) return "on_track"
  return "at_risk"
}

// ─── Objective grouping ─────────────────────────────────────────────────────────

interface ObjectiveGroup {
  id: string
  title: string
  owner?: string | null
  progress: number
  krs: Goal[]
}

/**
 * Turn a flat goal list into objective cards. When goals are nested via
 * `parent_goal_id` (OKRs), each parent becomes an objective and its children the
 * key results. Otherwise goals are grouped by category.
 */
function buildObjectives(
  goals: Goal[],
  generalLabel: string,
): ObjectiveGroup[] {
  const hasNesting = goals.some((g) => g.parent_goal_id)

  if (hasNesting) {
    const childMap = new Map<string, Goal[]>()
    const roots: Goal[] = []
    for (const g of goals) {
      if (g.parent_goal_id) {
        const arr = childMap.get(g.parent_goal_id) ?? []
        arr.push(g)
        childMap.set(g.parent_goal_id, arr)
      } else {
        roots.push(g)
      }
    }
    return roots.map((r) => ({
      id: r.goal_id,
      title: r.title,
      owner: r.owner_name,
      progress: Math.round(r.progress_pct ?? 0),
      krs: childMap.get(r.goal_id) ?? [],
    }))
  }

  const groups = new Map<string, Goal[]>()
  for (const g of goals) {
    const key = g.category?.trim() || generalLabel
    const arr = groups.get(key) ?? []
    arr.push(g)
    groups.set(key, arr)
  }
  return Array.from(groups.entries()).map(([title, krs], i) => ({
    id: `cat-${i}-${title}`,
    title,
    progress: krs.length
      ? Math.round(krs.reduce((s, k) => s + (k.progress_pct ?? 0), 0) / krs.length)
      : 0,
    krs,
  }))
}

// ─── Summary row ────────────────────────────────────────────────────────────────

function GoalsKpis({
  goals,
  objectives,
}: Readonly<{ goals: Goal[]; objectives: ObjectiveGroup[] }>) {
  const t = useTranslations("HrPerformance")
  const leaves = objectives.flatMap((o) => o.krs)
  const items = leaves.length ? leaves : goals
  const total = items.length || 1

  const onTrack = items.filter((g) => deriveKrStatus(g) === "on_track").length
  const atRisk = items.filter((g) => deriveKrStatus(g) === "at_risk").length
  const completed = items.filter((g) => deriveKrStatus(g) === "completed").length

  const pct = (n: number) => Math.round((n / total) * 100)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryStatCard
        label={t("kpiCompanyOkrs")}
        value={goals.length}
        hint={t("objectivesSet", { count: objectives.length })}
        icon={<Target strokeWidth={1.75} />}
        iconClassName="text-violet-600 dark:text-violet-300"
      />
      <SummaryStatCard
        label={t("krStatus.on_track")}
        value={onTrack}
        valueClassName="text-brand-success"
        hint={t("percentOfKeyResults", { percent: pct(onTrack) })}
        icon={<CheckCircle2 strokeWidth={1.75} />}
        iconClassName="text-brand-success"
      />
      <SummaryStatCard
        label={t("krStatus.at_risk")}
        value={atRisk}
        valueClassName="text-brand-warning"
        hint={t("percentNeedAttention", { percent: pct(atRisk) })}
        icon={<AlertTriangle strokeWidth={1.75} />}
        iconClassName="text-brand-warning"
      />
      <SummaryStatCard
        label={t("krStatus.completed")}
        value={completed}
        hint={t("percentAchieved", { percent: pct(completed) })}
        icon={<Award strokeWidth={1.75} />}
        iconClassName="text-brand-info"
      />
    </div>
  )
}

// ─── Objective card ─────────────────────────────────────────────────────────────

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

function ObjectiveCard({ objective }: Readonly<{ objective: ObjectiveGroup }>) {
  const t = useTranslations("HrPerformance")
  return (
    <Card variant="elevated" className="gap-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base leading-6 font-semibold text-content-primary">
            {objective.title}
          </h3>
          {objective.owner && (
            <p className="text-sm leading-5 text-content-tertiary">
              {t("owner", { name: objective.owner })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Progress value={objective.progress} color="indigo" className="w-20" />
          <span className="text-sm font-medium tabular-nums text-content-primary">
            {t("percent", { percent: objective.progress })}
          </span>
        </div>
      </div>

      {/* Key results */}
      <div className="px-6 pb-2">
        <Table>
          <TableHeader className="bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableHead className={HEAD_CLASS}>{t("colKeyResult")}</TableHead>
              <TableHead className={HEAD_CLASS}>{t("colProgress")}</TableHead>
              <TableHead className={HEAD_CLASS}>{t("colStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objective.krs.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="py-4 text-sm text-content-tertiary"
                >
                  {t("noKeyResults")}
                </TableCell>
              </TableRow>
            )}
            {objective.krs.map((kr) => {
              const krStatus = deriveKrStatus(kr)
              const progress = Math.round(kr.progress_pct ?? 0)
              return (
                <TableRow key={kr.goal_id}>
                  <TableCell className="text-sm font-medium text-content-primary">
                    {kr.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} color="indigo" className="w-16" />
                      <span className="text-xs tabular-nums text-content-tertiary">
                        {t("percent", { percent: progress })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={KR_STATUS_VARIANT[krStatus]}>
                      {t(`krStatus.${krStatus}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ─── States ─────────────────────────────────────────────────────────────────────

function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-[14px]" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-[14px]" />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <Card
      variant="elevated"
      className="min-h-48 items-center justify-center p-6 text-center"
    >
      <span className="text-sm text-content-tertiary">{message}</span>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GoalsTab() {
  const t = useTranslations("HrPerformance")
  const { data, isLoading, isError } = useMyGoals({ per_page: 100 })

  if (isLoading) return <GoalsSkeleton />

  const goals = data?.data ?? []
  const objectives = buildObjectives(goals, t("generalCategory"))

  return (
    <div className="flex flex-col gap-6">
      <GoalsKpis goals={goals} objectives={objectives} />

      {isError ? (
        <EmptyState message={t("goalsLoadError")} />
      ) : objectives.length === 0 ? (
        <EmptyState message={t("goalsEmpty")} />
      ) : (
        <div className="flex flex-col gap-4">
          {objectives.map((objective) => (
            <ObjectiveCard key={objective.id} objective={objective} />
          ))}
        </div>
      )}
    </div>
  )
}
