"use client"

import {
  CalendarClock,
  Diamond,
  Flag,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { StatusPill } from "../../all-project/components/project-detail/status-pill"
import { formatApiDate } from "../../lib/mappers/project-mapper"
import { usePortfolioSchedule } from "../../lib/queries/scheduling"

const SUMMARY_CARDS: {
  id: "milestones_total" | "overdue" | "due_this_week" | "on_critical_path"
  label: string
  caption: string
  icon: LucideIcon
  accent: string
  tile: string
}[] = [
  {
    id: "milestones_total",
    label: "Milestones",
    caption: "Across active projects",
    icon: Diamond,
    accent: "border-l-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  {
    id: "overdue",
    label: "Overdue",
    caption: "Past their due date",
    icon: TriangleAlert,
    accent: "border-l-brand-danger",
    tile: "bg-brand-danger/10 text-brand-danger",
  },
  {
    id: "due_this_week",
    label: "Due This Week",
    caption: "Need attention now",
    icon: CalendarClock,
    accent: "border-l-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  {
    id: "on_critical_path",
    label: "On Critical Path",
    caption: "Zero float items",
    icon: Flag,
    accent: "border-l-brand-info",
    tile: "bg-brand-info/10 text-brand-info",
  },
]

/** "All projects" scope of the Schedule page — cross-project milestones. */
export function PortfolioScheduleView() {
  const { data, isLoading, isError } = usePortfolioSchedule()

  if (isLoading)
    return <div className="bg-surface-muted h-[40vh] animate-pulse rounded-[14px]" />

  if (isError || !data)
    return (
      <Card className="flex h-48 items-center justify-center p-6">
        <p className="text-content-tertiary text-sm">
          Couldn&apos;t load the portfolio schedule.
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
              className={cn("flex-row items-center gap-3 border-l-4 p-4", card.accent)}
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
                  {card.label}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold tabular-nums">
                  {data.summary[card.id]}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {card.caption}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      <Card className="overflow-hidden p-0">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            Upcoming Milestones
          </h2>
          <p className="text-content-tertiary text-xs">
            Every project&apos;s milestones, sorted by due date
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Milestone</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.milestones.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  No milestones scheduled.
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
                    {formatApiDate(m.due_date)}
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
