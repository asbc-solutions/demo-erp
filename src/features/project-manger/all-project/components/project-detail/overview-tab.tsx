"use client"

import { Diamond, Receipt } from "lucide-react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Avatar } from "@/src/shared/components/ui/avatar"
import { Card } from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  buildHealthSummary,
  buildOverviewProgress,
  buildOverviewStats,
  buildTeam,
  buildUpcomingMilestones,
} from "../../../lib/mappers/overview-mapper"
import { useEvm, useNodeCost } from "../../../lib/queries/cost-budget"
import { useProjectHierarchy } from "../../../lib/queries/hierarchy"
import { useProject } from "../../../lib/queries/projects"
import { useProjectUtilization } from "../../../lib/queries/resources"
import { useMilestones } from "../../../lib/queries/scheduling"
import {
  HEALTH_STATE_KEY,
  type PhaseState,
} from "../../data/project-detail-data"

const PHASE_STYLE: Record<PhaseState, { chip: string; dot: string }> = {
  done: { chip: "bg-brand-success/12 text-content-primary", dot: "bg-brand-success" },
  active: { chip: "bg-brand-primary/12 text-content-primary", dot: "bg-brand-primary" },
  todo: { chip: "bg-surface-muted text-content-tertiary", dot: "bg-content-tertiary" },
}

const HEALTH_DOT: Record<string, string> = {
  "On Track": "bg-brand-success",
  "At Risk": "bg-brand-warning",
  Critical: "bg-brand-danger",
}

const HEALTH_TEXT: Record<string, string> = {
  "On Track": "text-brand-success",
  "At Risk": "text-brand-warning",
  Critical: "text-brand-danger",
}

const MILESTONE_ICON = { billing: Receipt, internal: Diamond }

export function OverviewTab({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsProjectDetail")
  const tShared = useTranslations("ProjectsShared")
  const locale = useIntlLocale()
  const nodeId = projectId

  const projectQ = useProject(projectId)
  const hierarchyQ = useProjectHierarchy(projectId)
  const milestonesQ = useMilestones(projectId)
  const evmQ = useEvm(projectId)
  const nodeCostQ = useNodeCost(nodeId)
  const utilizationQ = useProjectUtilization(projectId)

  const timelines = hierarchyQ.data ?? []
  const progress = buildOverviewProgress(timelines, projectQ.data?.end_date)
  const stats = buildOverviewStats(
    {
      nodeCost: nodeCostQ.data,
      evm: evmQ.data,
      progress,
    },
    tShared,
  )
  const health = buildHealthSummary(evmQ.data, nodeCostQ.data, tShared)
  const milestones = buildUpcomingMilestones(
    milestonesQ.data ?? [],
    tShared,
    locale,
  )
  const team = buildTeam(utilizationQ.data ?? [], tShared)

  if (hierarchyQ.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-surface-muted h-72 animate-pulse rounded-[14px] lg:col-span-2" />
        <div className="bg-surface-muted h-72 animate-pulse rounded-[14px]" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left column */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card className="gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-content-primary text-sm font-semibold">
              {t("projectProgress")}
            </h2>
            <p className="text-content-tertiary text-xs">
              {t.rich(
                progress.daysRemaining != null
                  ? "progressSummaryWithDays"
                  : "progressSummary",
                {
                  percent: progress.percent,
                  done: progress.tasksDone,
                  total: progress.tasksTotal,
                  days: progress.daysRemaining ?? 0,
                  strong: (chunks) => (
                    <span className="text-content-primary font-bold">
                      {chunks}
                    </span>
                  ),
                },
              )}
            </p>
          </div>
          <Progress
            value={progress.percent}
            color="indigo"
            className="bg-surface-muted h-2"
          />
          {progress.phases.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-content-tertiary text-[11px] font-semibold tracking-wide uppercase">
                {t("phaseTimeline")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {progress.phases.map((phase, i) => {
                  const style = PHASE_STYLE[phase.state]
                  return (
                    <div
                      key={`${phase.name}-${i}`}
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium",
                        style.chip,
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", style.dot)} />
                      {phase.name}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.id} className="gap-1 p-4">
                <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                  {stat.label}
                </span>
                <span className="text-content-primary text-xl leading-7 font-bold">
                  {stat.value}
                </span>
                <span className="text-content-tertiary text-[11px]">
                  {stat.caption}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-4">
        {health.length > 0 && (
          <Card className="gap-3 p-5">
            <h2 className="text-content-primary text-sm font-semibold">
              {t("healthSummary")}
            </h2>
            <div className="flex flex-col gap-3">
              {health.map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-content-secondary flex items-center gap-2 text-[13px] font-medium">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          HEALTH_DOT[item.state],
                        )}
                      />
                      {item.label}
                    </span>
                    <span
                      className={cn("text-xs font-medium", HEALTH_TEXT[item.state])}
                    >
                      {tShared(`health.${HEALTH_STATE_KEY[item.state]}`)}
                    </span>
                  </div>
                  <Progress
                    value={item.value}
                    color={item.color}
                    className="bg-surface-muted h-1.5"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="gap-3 p-5">
          <h2 className="text-content-primary text-sm font-semibold">
            {t("upcomingMilestones")}
          </h2>
          {milestonesQ.isLoading ? (
            <div className="bg-surface-muted h-24 animate-pulse rounded-lg" />
          ) : milestones.length === 0 ? (
            <p className="text-content-tertiary text-sm">
              {t("noUpcomingMilestones")}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {milestones.map((milestone) => {
                const Icon = MILESTONE_ICON[milestone.kind]
                const tone =
                  milestone.kind === "billing"
                    ? "bg-brand-warning/12 text-brand-warning"
                    : "bg-brand-primary/12 text-brand-primary"
                return (
                  <li key={milestone.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        tone,
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-content-primary text-[13px] font-medium">
                        {milestone.title}
                      </span>
                      <span className="text-content-tertiary text-[11px]">
                        {milestone.date} · {milestone.meta}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-3 p-5">
          <h2 className="text-content-primary text-sm font-semibold">
            {t("team")}
          </h2>
          {utilizationQ.isLoading ? (
            <div className="bg-surface-muted h-20 animate-pulse rounded-lg" />
          ) : team.length === 0 ? (
            <p className="text-content-tertiary text-sm">
              {t("noResourcesAssigned")}
            </p>
          ) : (
            <>
              <div className="flex items-center -space-x-2">
                {team.slice(0, 8).map((member) => (
                  <Avatar
                    key={member.id}
                    color={member.color}
                    className="ring-surface-white size-7 text-[10px] ring-2"
                  >
                    {member.initials}
                  </Avatar>
                ))}
                {team.length > 8 && (
                  <span className="bg-surface-muted text-content-tertiary ring-surface-white flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2">
                    +{team.length - 8}
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-3">
                {team.slice(0, 5).map((member) => (
                  <li key={member.id} className="flex items-center gap-2">
                    <Avatar color={member.color} className="size-7 text-[10px]">
                      {member.initials}
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-content-primary truncate text-[13px] font-medium">
                        {member.name}
                      </span>
                      <span className="text-content-tertiary text-[11px]">
                        {member.caption}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
