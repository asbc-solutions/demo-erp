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
import { useTranslations } from "next-intl"

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
import { useIntlLocale } from "@/src/i18n/intl-locale"
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

type TimeStatId = "posted" | "billable" | "pending" | "expenses"

/** "Jun 29 – Jul 5, 2026" in the active locale. */
function formatPeriod(start: string, end: string, locale: string): string {
  const from = new Date(start).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  })
  const to = new Date(end).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${from} – ${to}`
}

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
    border: "border-s-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-s-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  amber: {
    border: "border-s-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  violet: {
    border: "border-s-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

export function TimeExpenseModule() {
  const t = useTranslations("ProjectsTimeExpense")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
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

  const grid = useMemo(() => buildTimesheetGrid(data, locale), [data, locale])
  const stats = useMemo(() => buildTimeStats(data?.summary, locale), [data, locale])
  const summary = data?.summary
  const periodLabel = data
    ? formatPeriod(data.period_start, data.period_end, locale)
    : ""

  const statValue = (id: TimeStatId, value: string): string =>
    id === "posted" && summary
      ? t("hoursShort", { hours: summary.hours_posted })
      : value

  const statCaption = (id: TimeStatId): string => {
    switch (id) {
      case "posted":
        return summary
          ? t("statCaption.posted", { hours: summary.billable_hours })
          : ""
      case "billable":
        return t("statCaption.billable")
      case "pending":
        return t("statCaption.pending")
      case "expenses":
        return summary
          ? t("statCaption.expenses", { count: summary.receipt_count })
          : ""
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-content-tertiary text-sm">
            {periodLabel || t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={employeeId ?? undefined}
            onValueChange={setEmployeeId}
            disabled={resourcesQuery.isLoading || employees.length === 0}
          >
            <SelectTrigger className="h-9 w-[220px] text-[13px]">
              <SelectValue placeholder={t("selectEmployee")} />
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
              aria-label={t("previousWeek")}
              onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("nextWeek")}
              onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            >
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICON[stat.icon]
          const accent = STAT_ACCENT[stat.accent]
          const statId = stat.id as TimeStatId
          return (
            <Card
              key={stat.id}
              variant="elevated"
              className={cn(
                "flex-row items-center gap-3 border-s-4 p-4",
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
                  {t(`statLabel.${statId}`)}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold">
                  {isLoading ? "…" : statValue(statId, stat.value)}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {statCaption(statId)}
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
            {t("loadError")}
          </p>
        ) : grid.rows.length === 0 ? (
          <p className="text-content-tertiary py-12 text-center text-sm">
            {t("empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("colProjectTask")}</TableHead>
                {grid.days.map((day) => (
                  <TableHead key={day.date} className="text-center">
                    {new Date(day.date)
                      .toLocaleDateString(locale, { weekday: "short" })
                      .toUpperCase()}
                  </TableHead>
                ))}
                <TableHead className="text-end">{tCommon("total")}</TableHead>
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
                        {row.billable
                          ? t("projectBillable", { project: row.project })
                          : row.project}
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
                  <TableCell className="text-content-primary text-end text-[13px] font-bold tabular-nums">
                    {t("hoursShort", { hours: row.total })}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-content-primary text-[13px] font-semibold">
                  {t("dailyTotal")}
                </TableCell>
                {grid.dayTotals.map((total, i) => (
                  <TableCell
                    key={i}
                    className={cn(
                      "text-center text-[13px] font-semibold tabular-nums",
                      total > 0 ? "text-brand-success" : "text-content-tertiary",
                    )}
                  >
                    {t("hoursShort", { hours: total })}
                  </TableCell>
                ))}
                <TableCell className="text-brand-primary text-end text-[13px] font-bold tabular-nums">
                  {t("hoursShort", { hours: grid.weekTotal })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
