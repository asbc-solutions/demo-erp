"use client"

import { AlertTriangle, DollarSign, LayoutGrid, Wallet } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { PROJECT_KPI_TILES, type ProjectKpiAccent, type ProjectKpiTile } from "../data/operations-mock"
import { useProjectKpis, useProjects } from "../lib/queries/projects"
import { formatCurrencyAmount } from "../lib/utils/format"

import { OperationsErrorState } from "./shared/operations-error-state"
import { OperationsPageSpinner } from "./shared/operations-loading"
import { ProjectCard } from "./project-card"

const accentTile: Record<ProjectKpiAccent, string> = {
  indigo: "bg-brand-primary/10 text-brand-primary",
  amber: "bg-brand-warning/10 text-brand-warning",
  red: "bg-brand-danger/10 text-brand-danger",
}

const iconMap = {
  grid: LayoutGrid,
  dollar: DollarSign,
  wallet: Wallet,
  alert: AlertTriangle,
} as const

function ProjectKpiCard({ tile, value }: { tile: ProjectKpiTile; value: number }) {
  const Icon = iconMap[tile.icon]
  const display =
    tile.format === "currency" ? formatCurrencyAmount(value) : value.toLocaleString("en-US")
  return (
    <Card variant="elevated" className="flex-row items-center gap-4 p-5">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          accentTile[tile.accent],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-content-tertiary text-[11px] leading-[15.4px]">
          {tile.label}
        </span>
        <span className="text-content-primary text-[25px] leading-[32.5px] font-semibold">
          {display}
        </span>
      </div>
    </Card>
  )
}

export function ProjectsTab() {
  const projectsQuery = useProjects({ per_page: 100 })
  const kpisQuery = useProjectKpis()

  const isLoading = projectsQuery.isLoading || kpisQuery.isLoading
  const isError = projectsQuery.isError || kpisQuery.isError

  if (isLoading) {
    return <OperationsPageSpinner />
  }

  if (isError) {
    return (
      <OperationsErrorState
        message="Failed to load projects."
        onRetry={() => {
          void projectsQuery.refetch()
          void kpisQuery.refetch()
        }}
      />
    )
  }

  const projects = projectsQuery.data?.data ?? []
  const kpis = kpisQuery.data

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROJECT_KPI_TILES.map((tile) => (
          <ProjectKpiCard key={tile.key} tile={tile} value={kpis?.[tile.key] ?? 0} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projects.length === 0 ? (
          <div className="border-stroke-default bg-surface-white text-content-tertiary col-span-full flex h-24 items-center justify-center rounded-2xl border border-dashed text-[12px] leading-[18px]">
            No projects yet.
          </div>
        ) : (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        )}
      </section>
    </div>
  )
}
