"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  Filter,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"

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
    border: "border-l-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-l-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  red: {
    border: "border-l-brand-danger",
    tile: "bg-brand-danger/10 text-brand-danger",
  },
  violet: {
    border: "border-l-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

const FILTERS = ["Department", "Availability", "Skills"] as const

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
  const period = useMemo(() => currentMonthRange(), [])
  const [search, setSearch] = useState("")

  const summaryQuery = useResourcePlannerSummary(period)
  const heatmapQuery = useResourceHeatmap(period)
  const resourcesQuery = useResources({ per_page: 100 })

  const stats = useMemo(
    () => buildPlannerStats(summaryQuery.data),
    [summaryQuery.data],
  )
  const directory = useMemo(
    () => buildResourceDirectory(resourcesQuery.data ?? [], heatmapQuery.data ?? []),
    [resourcesQuery.data, heatmapQuery.data],
  )
  const heatmap = useMemo(
    () => buildHeatmapView(heatmapQuery.data),
    [heatmapQuery.data],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return directory
    return directory.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.skills.some((s) => s.toLowerCase().includes(q)),
    )
  }, [directory, search])

  const heatCols = `160px repeat(${heatmap.weeks.length}, minmax(44px, 1fr))`

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            Resource Planner
          </h1>
          <p className="text-content-tertiary text-sm">
            Manage capacity, skills, and assignments across all projects
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-9 px-3 text-[13px]">
            Level Resources
          </Button>
          <Button variant="primary" className="h-9 gap-2 px-3 text-[13px]">
            <Plus className="size-4" aria-hidden />
            Assign Resource
          </Button>
        </div>
      </header>

      {/* stat cards */}
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
                  {summaryQuery.isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {stat.caption}
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
              className="text-content-quaternary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or skill"
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          {FILTERS.map((label) => (
            <Button
              key={label}
              variant="outline"
              className="h-9 gap-2 px-3 text-[13px]"
            >
              <Filter className="size-3.5" aria-hidden />
              {label}
            </Button>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Resource</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resourcesQuery.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Loading resources…
                </TableCell>
              </TableRow>
            ) : resourcesQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Couldn&apos;t load resources.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  No resources found.
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
                        {r.billable ? "Billable" : "Non-billable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {r.rate}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="text-brand-primary text-[13px] font-medium hover:underline"
                      >
                        Assign
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
            Capacity Heatmap
          </h2>
          <p className="text-content-tertiary text-xs">
            Allocation % by week — orange/red indicates overload
          </p>
        </div>

        {heatmapQuery.isLoading ? (
          <div className="bg-surface-muted h-40 animate-pulse rounded-[14px]" />
        ) : heatmap.rows.length === 0 ? (
          <p className="text-content-tertiary py-8 text-center text-sm">
            No active allocations this month.
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
    </div>
  )
}
