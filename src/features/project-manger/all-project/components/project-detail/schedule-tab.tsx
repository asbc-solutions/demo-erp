"use client"

import { useMemo, useState } from "react"
import { GitBranch, Plus, Route, Settings } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { toGanttModel } from "../../../lib/mappers/schedule-mapper"
import { useCreateBaseline } from "../../../lib/mutations/scheduling"
import { useProjectHierarchy } from "../../../lib/queries/hierarchy"
import {
  useCriticalPath,
  useMilestones,
} from "../../../lib/queries/scheduling"
import type { ProgressColor } from "../../data/all-projects-data"
import { GANTT_LEGEND } from "../../data/project-detail-data"

const WEEK_W = 26
const LEFT_W = 300
const ROW_H = 36

const BAR_BG: Record<ProgressColor, string> = {
  indigo: "bg-brand-primary",
  emerald: "bg-brand-success",
  amber: "bg-brand-warning",
  red: "bg-brand-danger",
  blue: "bg-brand-info",
  violet: "bg-violet-500",
}

export function ScheduleTab({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsProjectDetail")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const { data: timelines, isLoading } = useProjectHierarchy(projectId)
  const { data: milestones } = useMilestones(projectId)
  const { data: criticalPath } = useCriticalPath(projectId)
  const createBaseline = useCreateBaseline(projectId)

  const [criticalOnly, setCriticalOnly] = useState(false)

  const model = useMemo(
    () => toGanttModel(timelines ?? [], milestones ?? [], criticalPath, locale),
    [timelines, milestones, criticalPath, locale],
  )

  const timelineW = model.totalWeeks * WEEK_W
  const todayX = model.todayWeek != null ? (model.todayWeek - 1) * WEEK_W : null

  const handleBaseline = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    createBaseline.mutate(
      { name: t("baselineName", { date: stamp }) },
      {
        onSuccess: () => toast.success(t("baselineCaptured")),
        onError: (err) =>
          toast.error(t("baselineFailed"), {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  const hasRows = model.rows.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
            {t("scheduleTitle")}
          </h2>
          <p className="text-content-tertiary text-sm">{t("scheduleSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={handleBaseline}
            disabled={createBaseline.isPending}
          >
            <GitBranch className="size-3.5" aria-hidden />
            {createBaseline.isPending ? t("saving") : t("baseline")}
          </Button>
          <Button
            variant={criticalOnly ? "primary" : "outline"}
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={() => setCriticalOnly((v) => !v)}
          >
            <Route className="size-3.5" aria-hidden />
            {t("criticalPath")}
          </Button>
          <Button variant="outline" className="h-9 gap-2 px-3 text-[12px]">
            <Settings className="size-3.5" aria-hidden />
            {tCommon("settings")}
          </Button>
          <Button variant="primary" className="h-9 gap-2 px-3 text-[12px]">
            <Plus className="size-4" aria-hidden />
            {t("addTask")}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-surface-muted h-96 w-full animate-pulse rounded-xl" />
      )}

      {!isLoading && !hasRows && (
        <Card className="flex h-64 items-center justify-center p-6">
          <p className="text-content-tertiary text-sm">
            {t("scheduleEmpty")}
          </p>
        </Card>
      )}

      {!isLoading && hasRows && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="relative" style={{ minWidth: LEFT_W + timelineW }}>
              {/* header: months + weeks */}
              <div className="bg-surface-page border-stroke-default sticky top-0 flex border-b">
                <div
                  className="text-content-tertiary flex shrink-0 items-end px-4 pb-1.5 text-[10px] font-semibold tracking-wide uppercase"
                  style={{ width: LEFT_W }}
                >
                  {t("colActivity")}
                </div>
                <div className="relative" style={{ width: timelineW }}>
                  <div className="flex">
                    {model.months.map((m, i) => (
                      <div
                        key={`${m.label}-${i}`}
                        className="border-stroke-light text-content-secondary border-s py-1 text-center text-[11px] font-semibold"
                        style={{ width: m.weeks * WEEK_W }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    {Array.from({ length: model.totalWeeks }).map((_, i) => (
                      <div
                        key={i}
                        className="text-content-quaternary shrink-0 pb-1 text-center text-[9px]"
                        style={{ width: WEEK_W }}
                      >
                        {t("weekShort", { week: i + 1 })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* rows */}
              <div>
                {model.rows.map((row) => (
                  <div
                    key={row.id}
                    className={cn(
                      "flex items-center transition-opacity",
                      row.critical && "bg-brand-danger/5",
                      criticalOnly && !row.critical && "opacity-30",
                    )}
                    style={{ height: ROW_H }}
                  >
                    <div
                      className="flex shrink-0 items-center gap-2 px-4"
                      style={{ width: LEFT_W }}
                    >
                      <span
                        className={cn(
                          "text-content-primary flex-1 truncate text-[13px]",
                          row.kind === "phase" ? "font-semibold" : "font-normal",
                          row.indent && "ps-3",
                        )}
                      >
                        {row.name}
                      </span>
                      <Avatar
                        color={row.owner.color}
                        className="size-[20px] shrink-0 text-[9px]"
                      >
                        {row.owner.initials}
                      </Avatar>
                      <span className="text-content-tertiary w-9 shrink-0 text-end text-[11px] font-medium tabular-nums">
                        {row.percent}%
                      </span>
                    </div>

                    <div
                      className="relative h-full"
                      style={{
                        width: timelineW,
                        backgroundImage:
                          "linear-gradient(to right, var(--stroke-light) 1px, transparent 1px)",
                        backgroundSize: `${WEEK_W}px 100%`,
                      }}
                    >
                      {row.kind === "milestone" ? (
                        <div
                          className={cn(
                            "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] rtl:translate-x-1/2",
                            BAR_BG[row.color],
                          )}
                          style={{ insetInlineStart: (row.startWeek - 1) * WEEK_W }}
                        />
                      ) : (
                        <div
                          className={cn(
                            "absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full",
                            BAR_BG[row.color],
                            row.kind === "phase" && "opacity-90",
                          )}
                          style={{
                            insetInlineStart: (row.startWeek - 1) * WEEK_W + 2,
                            width: row.span * WEEK_W - 4,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* today line */}
              {todayX != null && (
                <div
                  className="bg-brand-primary pointer-events-none absolute top-0 bottom-0 z-10 w-px"
                  style={{ insetInlineStart: LEFT_W + todayX }}
                >
                  <span className="bg-brand-primary absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[8px] font-semibold whitespace-nowrap text-white">
                    {t("today")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-stroke-default flex flex-wrap items-center gap-4 border-t px-4 py-3">
            {GANTT_LEGEND.map((item) => (
              <span
                key={item.labelKey}
                className="text-content-tertiary flex items-center gap-1.5 text-[11px]"
              >
                <span
                  className={cn(
                    "size-2.5",
                    BAR_BG[item.color],
                    item.milestone ? "rotate-45 rounded-[1px]" : "rounded-full",
                  )}
                />
                {t(item.labelKey)}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
