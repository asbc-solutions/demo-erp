"use client"

import { useMemo, useState } from "react"
import {
  BadgeDollarSign,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Flag,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  buildTimeStats,
  buildTimesheetGrid,
  currentWeekStart,
  shiftWeek,
  type TimeStat,
} from "../../lib/mappers/time-expense-mapper"
import { useCurrentTimesheet } from "../../lib/queries/time-expense"
import { useResources } from "../../lib/queries/resources"

const STAT_ICON: Record<TimeStat["icon"], LucideIcon> = {
  check: CheckCircle2,
  dollar: BadgeDollarSign,
  flag: Flag,
  diamond: Diamond,
}

const STAT_ACCENT: Record<
  TimeStat["accent"],
  { border: string; tile: string }
> = {
  indigo: {
    border: "border-l-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-l-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  amber: {
    border: "border-l-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  violet: {
    border: "border-l-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

export function TimeExpenseModule() {
  const resourcesQuery = useResources({ per_page: 100 })
  const employees = useMemo(
    () => resourcesQuery.data ?? [],
    [resourcesQuery.data],
  )

  // Derive the effective employee (defaults to the first) — `picked` only
  // holds an explicit user choice, avoiding a setState-in-effect.
  const [picked, setPicked] = useState<string | null>(null)
  const employeeId = picked ?? employees[0]?.employee_id ?? null
  const setEmployeeId = setPicked

  const [weekStart, setWeekStart] = useState(() => currentWeekStart())

  const { data, isLoading, isError } = useCurrentTimesheet(
    employeeId ?? "",
    weekStart,
  )

  const grid = useMemo(() => buildTimesheetGrid(data), [data])
  const stats = useMemo(() => buildTimeStats(data?.summary), [data])

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            Time &amp; Expense
          </h1>
          <p className="text-content-tertiary text-sm">
            {grid.periodLabel || "Weekly timesheet and expenses"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={employeeId ?? undefined}
            onValueChange={setEmployeeId}
            disabled={resourcesQuery.isLoading || employees.length === 0}
          >
            <SelectTrigger className="h-9 w-[220px] text-[13px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.employee_id} value={e.employee_id}>
                  {`${e.first_name} ${e.last_name}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border-stroke-default flex items-center gap-1 rounded-lg border p-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous week"
              onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next week"
              onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICON[stat.icon]
          const accent = STAT_ACCENT[stat.accent]
          return (
            <Card
              key={stat.id}
              variant="elevated"
              className={cn(
                "flex-row items-center gap-3 border-l-4 p-4",
                accent.border,
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  accent.tile,
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-content-tertiary text-[11px] font-medium tracking-wide uppercase">
                  {stat.label}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold">
                  {isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {stat.caption}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="bg-surface-muted m-4 h-48 animate-pulse rounded-lg" />
        ) : isError ? (
          <p className="text-content-tertiary py-12 text-center text-sm">
            Couldn&apos;t load timesheet.
          </p>
        ) : grid.rows.length === 0 ? (
          <p className="text-content-tertiary py-12 text-center text-sm">
            No time logged this week.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project / Task</TableHead>
                {grid.days.map((day) => (
                  <TableHead key={day.date} className="text-center">
                    {day.label.toUpperCase()}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grid.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-content-primary text-[13px] font-medium">
                        {row.task}
                      </span>
                      <span className="text-content-tertiary text-[11px]">
                        {row.project}
                        {row.billable ? " · Billable" : ""}
                      </span>
                    </div>
                  </TableCell>
                  {row.hours.map((h, i) => (
                    <TableCell key={i} className="text-center">
                      <span
                        className={cn(
                          "inline-flex h-8 w-12 items-center justify-center rounded-md border text-[13px]",
                          h != null
                            ? "border-stroke-light bg-surface-muted text-content-primary font-medium"
                            : "border-stroke-input bg-surface-white",
                        )}
                      >
                        {h ?? ""}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-content-primary text-right text-[13px] font-bold tabular-nums">
                    {row.total}h
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-content-primary text-[13px] font-semibold">
                  Daily Total
                </TableCell>
                {grid.dayTotals.map((total, i) => (
                  <TableCell
                    key={i}
                    className={cn(
                      "text-center text-[13px] font-semibold tabular-nums",
                      total > 0 ? "text-brand-success" : "text-content-tertiary",
                    )}
                  >
                    {total}h
                  </TableCell>
                ))}
                <TableCell className="text-brand-primary text-right text-[13px] font-bold tabular-nums">
                  {grid.weekTotal}h
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
