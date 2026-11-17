"use client"

import { Diamond } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { useMyMilestones } from "../../lib/queries/my-work"

export function UpcomingMilestonesCard() {
  const t = useTranslations("ProjectsMyProjects")
  const { data, isLoading, isError } = useMyMilestones({
    horizon_days: 90,
    limit: 10,
  })
  const milestones = data ?? []

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default flex flex-col gap-0.5 border-b px-5 py-3.5">
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          {t("upcomingMilestones")}
        </h2>
        <p className="text-content-tertiary text-[12px] leading-[17px]">
          {t("upcomingMilestonesSubtitle", { days: 90 })}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-10 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-content-tertiary px-5 py-8 text-center text-sm">
          {t("milestonesLoadFailed")}
        </p>
      ) : milestones.length === 0 ? (
        <p className="text-content-tertiary px-5 py-8 text-center text-sm">
          {t("noUpcomingMilestones")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {milestones.map((milestone) => (
            <li
              key={milestone.id}
              className="border-stroke-default flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
            >
              <Diamond
                className={cn(
                  "size-4 shrink-0 fill-current",
                  milestone.urgent ? "text-brand-warning" : "text-brand-primary",
                )}
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-content-primary truncate text-sm leading-5 font-medium">
                  {milestone.title}
                </span>
                <span className="text-content-tertiary truncate text-[12px] leading-[17px]">
                  {milestone.project_name}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-content-primary text-[12px] leading-[17px] font-medium tabular-nums">
                  {milestone.date_label}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-4 tabular-nums",
                    milestone.urgent
                      ? "text-brand-warning font-medium"
                      : "text-content-tertiary",
                  )}
                >
                  {milestone.relative_label}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
