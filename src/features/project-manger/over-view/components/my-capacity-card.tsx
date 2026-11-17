"use client"

import { useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import { CircularProgress } from "@/src/shared/components/ui/circular-progress"
import { cn } from "@/src/shared/lib/utils/utils"

import { useMyCapacity } from "../../lib/queries/my-work"

const CAPACITY_DOT: Record<string, string> = {
  indigo: "bg-brand-primary",
  emerald: "bg-brand-success",
  amber: "bg-brand-warning",
}

export function MyCapacityCard() {
  const t = useTranslations("ProjectsOverview")
  const { data, isLoading, isError } = useMyCapacity()

  const bookedHours = data?.booked_hours ?? 0
  const totalHours = data?.total_hours ?? 0
  const breakdown = data?.breakdown ?? []
  const percent = totalHours > 0 ? Math.round((bookedHours / totalHours) * 100) : 0

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default flex flex-col gap-0.5 border-b px-5 py-3.5">
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          {t("myCapacity")}
        </h2>
        <p className="text-content-tertiary text-[12px] leading-[17px]">
          {t("thisWeek")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-5 p-5">
          <div className="bg-surface-muted size-28 animate-pulse rounded-full" />
          <div className="bg-surface-muted h-16 w-full animate-pulse rounded-lg" />
        </div>
      ) : isError ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          {t("capacityLoadFailed")}
        </p>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex justify-center pt-1">
            <CircularProgress
              value={percent}
              size={112}
              strokeWidth={12}
              color="indigo"
            >
              <span className="text-content-primary text-xl leading-6 font-bold">
                {bookedHours}
                <span className="text-content-tertiary text-[11px] font-medium">
                  {t("capacityTotal", { hours: totalHours })}
                </span>
              </span>
              <span className="text-content-tertiary text-[10px] leading-[15px] tracking-wide uppercase">
                {t("booked")}
              </span>
            </CircularProgress>
          </div>

          {breakdown.length === 0 ? (
            <p className="text-content-tertiary text-center text-[12px]">
              {t("noHoursThisWeek")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {breakdown.map((row) => (
                <li key={row.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      CAPACITY_DOT[row.color] ?? "bg-brand-primary",
                    )}
                    aria-hidden
                  />
                  <span className="text-content-secondary flex-1 text-sm leading-[18px]">
                    {row.label}
                  </span>
                  <span className="text-content-primary text-sm leading-[18px] font-medium tabular-nums">
                    {t("hoursShort", { hours: row.hours })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
