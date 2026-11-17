"use client"

import { useCallback, useMemo, useState } from "react"
import {
  AlertCircle,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { Progress } from "@/src/shared/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ProgressColor } from "../../all-project/data/all-projects-data"
import {
  buildHeatmapView,
  buildPlannerStats,
  buildResourceDirectory,
  currentMonthRange,
  type PlannerStat,
} from "../../lib/mappers/resource-mapper"
import {
  useResourceHeatmap,
  useResourcePlannerSummary,
  useResources,
} from "../../lib/queries/resources"
import { useResourceDepartments } from "../lib/use-resource-departments"
import { AssignResourceDialog } from "./assign-resource-dialog"
import {
  EMPTY_RESOURCE_FILTERS,
  ResourceDirectoryFilters,
  matchesAvailability,
  type ResourceFilterValues,
} from "./resource-directory-filters"
import {
  LevelResourcesDialog,
  type OverAllocatedResource,
} from "./level-resources-dialog"

const STAT_ICON: Record<PlannerStat["icon"], LucideIcon> = {
  users: Users,
  zap: Zap,
  alert: AlertCircle,
  sparkles: Sparkles,
}

const STAT_ACCENT: Record<
  PlannerStat["accent"],
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
  red: {
    border: "border-s-brand-danger",
    tile: "bg-brand-danger/10 text-brand-danger",
  },
  violet: {
    border: "border-s-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

type PlannerStatId = "total" | "utilization" | "overloaded" | "matches"

function availabilityColor(value: number): ProgressColor {
  if (value > 100) return "red"
  if (value >= 85) return "indigo"
  return "emerald"
}

function heatCell(value: number): string {
  if (value > 110) return "bg-brand-danger text-white"
  if (value >= 100) return "bg-brand-warning text-white"
  if (value >= 80) return "bg-brand-primary text-white"
  return "bg-surface-muted text-content-tertiary"
}

export function ResourcePlannerModule() {
  const t = useTranslations("ProjectsResourcePlanner")
  const locale = useIntlLocale()
  const period = useMemo(() => currentMonthRange(), [])
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<ResourceFilterValues>(
    EMPTY_RESOURCE_FILTERS,
  )
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignEmployeeId, setAssignEmployeeId] = useState<string | null>(null)
  const [levelOpen, setLevelOpen] = useState(false)

  const summaryQuery = useResourcePlannerSummary(period)
  const heatmapQuery = useResourceHeatmap(period)
  const resourcesQuery = useResources({ per_page: 100 })
  const departmentByEmployee = useResourceDepartments()

  const stats = useMemo(
    () => buildPlannerStats(summaryQuery.data),
    [summaryQuery.data],
  )
  const directory = useMemo(
    () => buildResourceDirectory(resourcesQuery.data ?? [], heatmapQuery.data ?? [], (rate) =>
        t("ratePerHour", { rate }),
      ),
    [resourcesQuery.data, heatmapQuery.data, t],
  )
  const heatmap = useMemo(
    () => buildHeatmapView(heatmapQuery.data, locale),
    [heatmapQuery.data, locale],
  )

  const departmentOptions = useMemo(() => {
    const names = new Set<string>()
    for (const row of directory) {
      const department = departmentByEmployee.get(row.id)
      if (department) names.add(department)
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [directory, departmentByEmployee])

  const skillOptions = useMemo(() => {
    const names = new Set<string>()
    for (const row of directory) for (const skill of row.skills) names.add(skill)
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [directory])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return directory.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.skills.some((s) => s.toLowerCase().includes(q))
      if (!matchesSearch) return false
      if (
        filters.department &&
        departmentByEmployee.get(r.id) !== filters.department
      ) {
        return false
      }
      if (filters.skill && !r.skills.includes(filters.skill)) return false
      if (
        filters.availability &&
        !matchesAvailability(filters.availability, r.availabilityPct)
      ) {
        return false
      }
      return true
    })
  }, [directory, search, filters, departmentByEmployee])

  const overAllocated = useMemo<OverAllocatedResource[]>(() => {
    const peakByEmployee = new Map(
      heatmap.rows.map((row) => [
        row.id,
        row.cells.length ? Math.max(...row.cells) : null,
      ]),
    )
    return directory
      .flatMap((r) =>
        r.availabilityPct != null && r.availabilityPct > 100
          ? [
              {
                id: r.id,
                name: r.name,
                initials: r.initials,
                color: r.color,
                allocationPct: r.availabilityPct,
                peakPct: peakByEmployee.get(r.id) ?? null,
              },
            ]
          : [],
      )
      .sort((a, b) => b.allocationPct - a.allocationPct)
  }, [directory, heatmap.rows])

  const openAssign = useCallback((employeeId: string | null) => {
    setAssignEmployeeId(employeeId)
    // "Rebalance" hands over from the levelling dialog. Opening the second
    // dialog in the same frame races the first one's focus-trap teardown, which
    // is what leaves `pointer-events: none` stuck on <body>; let it close first.
    setLevelOpen(false)
    requestAnimationFrame(() => setAssignOpen(true))
  }, [])

  const heatCols = `160px repeat(${heatmap.weeks.length}, minmax(44px, 1fr))`

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-content-tertiary text-sm">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 px-3 text-[13px]"
            onClick={() => setLevelOpen(true)}
          >
            {t("levelResources")}
          </Button>
          <Button
            variant="primary"
            className="h-9 gap-2 px-3 text-[13px]"
            onClick={() => openAssign(null)}
          >
            <Plus className="size-4" aria-hidden />
            {t("assignResource")}
          </Button>
        </div>
      </header>

      {/* stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICON[stat.icon]
          const accent = STAT_ACCENT[stat.accent]
          const statId = stat.id as PlannerStatId
          const summary = summaryQuery.data
          const caption =
            statId === "total"
              ? summary
                ? t("statCaption.total", { count: summary.department_count })
                : ""
              : t(`statCaption.${statId}`)
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
                  {summaryQuery.isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {caption}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      {/* directory: filter bar + table */}
      <Card className="overflow-hidden p-0">
        <div className="border-stroke-default flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="relative max-w-xs flex-1">
            <Search
              className="text-content-quaternary pointer-events-none absolute top-1/2 inset-s-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-9 ps-9 text-[13px]"
            />
          </div>
          <ResourceDirectoryFilters
            values={filters}
            onChange={setFilters}
            departments={departmentOptions}
            skills={skillOptions}
          />
          <span className="text-content-tertiary ms-auto text-xs tabular-nums">
            {t("shownOfTotal", { shown: rows.length, total: directory.length })}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("colResource")}</TableHead>
              <TableHead>{t("colSkills")}</TableHead>
              <TableHead>{t("colAllocation")}</TableHead>
              <TableHead>{t("colBillable")}</TableHead>
              <TableHead>{t("colRate")}</TableHead>
              <TableHead className="text-end">{t("colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resourcesQuery.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("loadingResources")}
                </TableCell>
              </TableRow>
            ) : resourcesQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("loadError")}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("noMatches")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const alloc = r.availabilityPct
                const over = alloc != null && alloc > 100
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar color={r.color} className="size-7 text-[10px]">
                          {r.initials}
                        </Avatar>
                        <span className="text-content-primary text-[13px] font-medium">
                          {r.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.skills.length === 0 ? (
                          <span className="text-content-tertiary text-[12px]">
                            —
                          </span>
                        ) : (
                          r.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="primary"
                              className="text-[11px]"
                            >
                              {skill}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alloc == null ? (
                        <span className="text-content-tertiary text-[12px]">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(alloc, 100)}
                            color={availabilityColor(alloc)}
                            className="bg-surface-muted h-1.5 w-16"
                          />
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              over
                                ? "text-brand-danger"
                                : "text-content-secondary",
                            )}
                          >
                            {alloc}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.billable ? "success" : "neutral"}
                        className="text-[11px]"
                      >
                        {r.billable ? t("billable") : t("nonBillable")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {r.rate}
                    </TableCell>
                    <TableCell className="text-end">
                      <button
                        type="button"
                        onClick={() => openAssign(r.id)}
                        className="text-brand-primary text-[13px] font-medium hover:underline"
                      >
                        {t("assign")}
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* capacity heatmap */}
      <Card className="p-4">
        <div className="mb-3 flex flex-col gap-0.5">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            {t("heatmapTitle")}
          </h2>
          <p className="text-content-tertiary text-xs">
            {t("heatmapSubtitle")}
          </p>
        </div>

        {heatmapQuery.isLoading ? (
          <div className="bg-surface-muted h-40 animate-pulse rounded-[14px]" />
        ) : heatmap.rows.length === 0 ? (
          <p className="text-content-tertiary py-8 text-center text-sm">
            {t("heatmapEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* week header */}
              <div
                className="grid items-center gap-1 pb-1"
                style={{ gridTemplateColumns: heatCols }}
              >
                <span />
                {heatmap.weeks.map((w) => (
                  <span
                    key={w}
                    className="text-content-tertiary text-center text-[11px] font-medium"
                  >
                    {w}
                  </span>
                ))}
              </div>

              {/* rows */}
              {heatmap.rows.map((row) => (
                <div
                  key={row.id}
                  className="grid items-center gap-1 py-1"
                  style={{ gridTemplateColumns: heatCols }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar color={row.color} className="size-6 text-[9px]">
                      {row.initials}
                    </Avatar>
                    <span className="text-content-primary truncate text-[12px] font-medium">
                      {row.name}
                    </span>
                  </div>
                  {row.cells.map((value, i) => (
                    <span
                      key={i}
                      className={cn(
                        "rounded-md py-1 text-center text-[11px] font-medium tabular-nums",
                        heatCell(value),
                      )}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <AssignResourceDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        resources={directory}
        defaultEmployeeId={assignEmployeeId}
      />
      <LevelResourcesDialog
        open={levelOpen}
        onOpenChange={setLevelOpen}
        resources={overAllocated}
        onReassign={openAssign}
      />
    </div>
  )
}
