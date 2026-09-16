"use client"

import { useMemo } from "react"
import { AlertCircle, Clock, Users, Zap, type LucideIcon } from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
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

import {
  avatarColorFor,
  initialsOf,
  summarizeUtilization,
} from "../../../lib/mappers/resource-mapper"
import { useProjectUtilization } from "../../../lib/queries/resources"
import type { ProgressColor } from "../../data/all-projects-data"

function allocationColor(value: number): ProgressColor {
  if (value > 100) return "red"
  if (value >= 85) return "indigo"
  return "emerald"
}

type StatTile = {
  id: string
  label: string
  value: string
  caption: string
  icon: LucideIcon
  border: string
  tile: string
}

export function ResourcesTab({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useProjectUtilization(projectId)
  const rows = useMemo(() => data ?? [], [data])
  const summary = useMemo(() => summarizeUtilization(rows), [rows])

  const stats: StatTile[] = [
    {
      id: "total",
      label: "Assigned Resources",
      value: String(summary.total),
      caption: "On this project",
      icon: Users,
      border: "border-l-brand-primary",
      tile: "bg-brand-primary/10 text-brand-primary",
    },
    {
      id: "util",
      label: "Avg Allocation",
      value: `${summary.avgAllocation}%`,
      caption: summary.avgAllocation > 100 ? "Over capacity" : "Across assignees",
      icon: Zap,
      border: "border-l-brand-success",
      tile: "bg-brand-success/10 text-brand-success",
    },
    {
      id: "over",
      label: "Overloaded",
      value: String(summary.overloaded),
      caption: ">100% allocated",
      icon: AlertCircle,
      border: "border-l-brand-danger",
      tile: "bg-brand-danger/10 text-brand-danger",
    },
    {
      id: "hours",
      label: "Planned Hours",
      value: summary.totalPlannedHours.toLocaleString(),
      caption: "Total committed",
      icon: Clock,
      border: "border-l-violet-500",
      tile: "bg-violet-500/10 text-violet-500",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
            Resource Planner
          </h2>
          <p className="text-content-tertiary text-sm">
            Allocation and committed hours across this project&apos;s assignees
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" className="h-9 gap-2 px-3 text-[12px]">
            + Assign Resource
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            variant="elevated"
            className={cn("flex-row items-center gap-3 border-l-4 p-4", stat.border)}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                stat.tile,
              )}
            >
              <stat.icon className="size-[18px]" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-content-tertiary text-[11px] font-medium tracking-wide uppercase">
                {stat.label}
              </span>
              <span className="text-content-primary text-xl leading-[25px] font-bold">
                {stat.value}
              </span>
              <span className="text-content-tertiary text-[12px]">
                {stat.caption}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Resource</TableHead>
              <TableHead>Employee #</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Planned Hours</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="bg-surface-muted h-8 w-full animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Couldn&apos;t load resource utilization.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  No resources assigned to this project yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              rows.map((row) => {
                const over = row.total_allocation_pct > 100
                return (
                  <TableRow key={row.employee_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar
                          color={avatarColorFor(row.employee_id)}
                          className="size-7 text-[10px]"
                        >
                          {initialsOf(row.name)}
                        </Avatar>
                        <span className="text-content-primary text-[13px] font-medium">
                          {row.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-content-tertiary font-mono text-[12px]">
                      {row.employee_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(row.total_allocation_pct, 100)}
                          color={allocationColor(row.total_allocation_pct)}
                          className="bg-surface-muted h-1.5 w-16"
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums",
                            over ? "text-brand-danger" : "text-content-secondary",
                          )}
                        >
                          {row.total_allocation_pct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {row.total_planned_hours}h
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {row.assignment_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          over
                            ? "bg-brand-danger/10 text-brand-danger"
                            : "bg-brand-success/10 text-brand-success",
                        )}
                      >
                        {over ? "Overloaded" : "Healthy"}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
