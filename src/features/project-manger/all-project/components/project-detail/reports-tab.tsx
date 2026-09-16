"use client"

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

import {
  buildPortfolioByType,
  buildReportKpis,
} from "../../../lib/mappers/reports-mapper"
import { useProjects } from "../../../lib/queries/projects"

export function ReportsTab() {
  // Portfolio-wide analytics — derived from the full projects list.
  const { data, isLoading, isError } = useProjects()
  const projects = data?.data ?? []
  const kpis = buildReportKpis(projects)
  const byType = buildPortfolioByType(projects)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
          Reports &amp; Analytics
        </h2>
        <p className="text-content-tertiary text-sm">
          Portfolio-wide delivery insights across all projects
        </p>
      </div>

      {isLoading ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-24 animate-pulse rounded-[14px]"
            />
          ))}
        </section>
      ) : isError ? (
        <Card className="flex h-48 items-center justify-center p-6">
          <p className="text-content-tertiary text-sm">
            Couldn&apos;t load portfolio analytics.
          </p>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="flex h-48 items-center justify-center p-6">
          <p className="text-content-tertiary text-sm">No projects yet.</p>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.id} className="gap-1 p-4">
                <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                  {kpi.label}
                </span>
                <span className="text-content-primary text-2xl leading-7 font-bold">
                  {kpi.value}
                </span>
              </Card>
            ))}
          </section>

          <Card className="gap-3 p-5">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-content-primary text-sm font-semibold">
                Portfolio by Type
              </h3>
              <p className="text-content-tertiary text-xs">
                Project count and share of the portfolio
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byType.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="text-content-primary text-[13px] font-medium">
                      {row.type}
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px]">
                      {row.projects}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={row.sharePct}
                          color={row.color}
                          className="bg-surface-muted h-1.5 w-24"
                        />
                        <span className="text-content-secondary text-xs font-semibold tabular-nums">
                          {row.sharePct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
