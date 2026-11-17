"use client"

import {
  CalendarClock,
  Diamond,
  Flag,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { useIntlLocale } from "@/src/i18n/intl-locale"
import { cn } from "@/src/shared/lib/utils/utils"

import { StatusPill } from "../../all-project/components/project-detail/status-pill"
import { formatApiDate } from "../../lib/mappers/project-mapper"
import { usePortfolioSchedule } from "../../lib/queries/scheduling"

const SUMMARY_CARDS = [
  {
    id: "milestones_total",
    labelKey: "cardMilestones",
    captionKey: "cardMilestonesCaption",
    icon: Diamond,
    accent: "border-s-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  {
    id: "overdue",
    labelKey: "cardOverdue",
    captionKey: "cardOverdueCaption",
    icon: TriangleAlert,
    accent: "border-s-brand-danger",
    tile: "bg-brand-danger/10 text-brand-danger",
  },
  {
    id: "due_this_week",
    labelKey: "cardDueThisWeek",
    captionKey: "cardDueThisWeekCaption",
    icon: CalendarClock,
    accent: "border-s-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  {
    id: "on_critical_path",
    labelKey: "cardCriticalPath",
    captionKey: "cardCriticalPathCaption",
    icon: Flag,
    accent: "border-s-brand-info",
    tile: "bg-brand-info/10 text-brand-info",
  },
] as const satisfies readonly {
  id: "milestones_total" | "overdue" | "due_this_week" | "on_critical_path"
  labelKey: string
  captionKey: string
  icon: LucideIcon
  accent: string
  tile: string
}[]

/** "All projects" scope of the Schedule page — cross-project milestones. */
export function PortfolioScheduleView() {
  const t = useTranslations("ProjectsSchedule")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const { data, isLoading, isError } = usePortfolioSchedule()

  if (isLoading)
    return <div className="bg-surface-muted h-[40vh] animate-pulse rounded-[14px]" />

  if (isError || !data)
    return (
      <Card className="flex h-48 items-center justify-center p-6">
        <p className="text-content-tertiary text-sm">
          {t("loadError")}
        </p>
      </Card>
    )

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.id}
              variant="elevated"
              className={cn("flex-row items-center gap-3 border-s-4 p-4", card.accent)}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  card.tile,
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-content-tertiary text-[11px] font-medium tracking-wide uppercase">
                  {t(card.labelKey)}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold tabular-nums">
                  {data.summary[card.id]}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {t(card.captionKey)}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      <Card className="overflow-hidden p-0">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            {t("upcomingMilestones")}
          </h2>
          <p className="text-content-tertiary text-xs">
            {t("upcomingMilestonesSubtitle")}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("colMilestone")}</TableHead>
              <TableHead>{t("colProject")}</TableHead>
              <TableHead>{t("colDueDate")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.milestones.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              data.milestones.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-content-primary text-[13px] font-medium">
                    <span className="flex items-center gap-2">
                      <Diamond
                        className={cn(
                          "size-3.5 shrink-0 fill-current",
                          m.is_overdue
                            ? "text-brand-danger"
                            : "text-brand-primary",
                        )}
                        aria-hidden
                      />
                      {m.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px]">
                    {m.project_name}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] tabular-nums",
                      m.is_overdue
                        ? "text-brand-danger font-semibold"
                        : "text-content-secondary",
                    )}
                  >
                    {formatApiDate(m.due_date, locale)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={m.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
