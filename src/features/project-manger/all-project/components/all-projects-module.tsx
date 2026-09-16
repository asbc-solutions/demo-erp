"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { LayoutGrid, List, Plus, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { NewProjectWizard } from "../../over-view/components/new-project-wizard"
import { mapProjectRow } from "../../lib/mappers/project-mapper"
import { useImportProjects } from "../../lib/mutations/projects"
import { useProjects, useProjectStats } from "../../lib/queries/projects"
import type { ProjectListParams, ProjectStats } from "../../lib/types"

import { AllProjectsStatCard, type ProjectStat } from "./all-projects-stat-card"
import { ProjectGridCard } from "./project-grid-card"
import {
  ProjectsFilterBar,
  type ProjectFilterState,
} from "./projects-filter-bar"
import { ProjectsTable } from "./projects-table"

type ProjectView = "grid" | "list"

const VIEW_OPTIONS: { id: ProjectView; label: string; icon: typeof LayoutGrid }[] =
  [
    { id: "grid", label: "Grid", icon: LayoutGrid },
    { id: "list", label: "List", icon: List },
  ]

const INITIAL_FILTERS: ProjectFilterState = {
  search: "",
  status: "all",
  projectType: "all",
}

function buildStats(stats: ProjectStats): ProjectStat[] {
  return [
    {
      id: "total",
      label: "Total Projects",
      value: String(stats.total),
      caption: `+${stats.new_this_month} this month`,
      icon: "folder",
      accent: "indigo",
    },
    {
      id: "active",
      label: "Active",
      value: String(stats.active_count),
      caption: "On track",
      icon: "zap",
      accent: "emerald",
    },
    {
      id: "at-risk",
      label: "At Risk",
      value: String(stats.at_risk_count),
      caption: "Require attention",
      icon: "alert",
      accent: "amber",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: String(stats.overdue_count),
      caption: "Past deadline",
      icon: "clock",
      accent: "red",
    },
  ]
}

export function AllProjectsModule() {
  const [view, setView] = useState<ProjectView>("grid")
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [filters, setFilters] = useState<ProjectFilterState>(INITIAL_FILTERS)

  // Debounce the search box so each keystroke doesn't fire a request.
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(filters.search.trim()),
      350,
    )
    return () => window.clearTimeout(id)
  }, [filters.search])

  const params = useMemo<ProjectListParams>(() => {
    const p: ProjectListParams = { per_page: 50 }
    if (debouncedSearch) p.search = debouncedSearch
    if (filters.status !== "all") p.status = filters.status
    if (filters.projectType !== "all") p.project_type = filters.projectType
    return p
  }, [debouncedSearch, filters.status, filters.projectType])

  const { data, isLoading, isError, error } = useProjects(params)
  const statsQ = useProjectStats()
  const importProjects = useImportProjects()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(
    () => (statsQ.data ? buildStats(statsQ.data) : null),
    [statsQ.data],
  )

  const handleImportFile = (file: File) => {
    importProjects.mutate(file, {
      onSuccess: (result) => {
        const errorNote =
          result.errors.length > 0
            ? ` · ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} failed`
            : ""
        toast.success(`Imported ${result.created} projects`, {
          description: `${result.skipped} skipped${errorNote}`,
        })
      },
      onError: (err) =>
        toast.error("Import failed", {
          description: (err as unknown as ApiError).message,
        }),
    })
  }

  useEffect(() => {
    if (isError) {
      const message =
        (error as { message?: string })?.message ?? "Failed to load projects"
      toast.error(message)
    }
  }, [isError, error])

  const projects = useMemo(
    () => (data?.data ?? []).map(mapProjectRow),
    [data],
  )

  const handleFilterChange = (patch: Partial<ProjectFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }))

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-content-tertiary text-sm leading-5">
            Manage and track all your project engagements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImportFile(file)
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            className="h-9 gap-2 px-3 text-[12px]"
            disabled={importProjects.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden />
            {importProjects.isPending ? "Importing…" : "Import"}
          </Button>

          <div className="bg-surface-white border-stroke-default flex items-center gap-0.5 rounded-xl border p-1">
            {VIEW_OPTIONS.map((option) => {
              const isActive = view === option.id
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-[30px] items-center gap-1.5 rounded-lg px-3 text-[12px] leading-[18px] font-medium transition-colors",
                    isActive
                      ? "bg-surface-page text-brand-primary shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                      : "text-content-tertiary hover:text-content-primary",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {option.label}
                </button>
              )
            })}
          </div>

          <Button
            variant="primary"
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={() => setNewProjectOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            New Project
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          stats.map((stat) => <AllProjectsStatCard key={stat.id} stat={stat} />)
        ) : statsQ.isError ? (
          <p className="text-content-tertiary col-span-full py-4 text-sm">
            Couldn&apos;t load project stats.
          </p>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-[86px] animate-pulse rounded-[14px]"
            />
          ))
        )}
      </section>

      <ProjectsFilterBar value={filters} onChange={handleFilterChange} />

      {isLoading ? (
        <ProjectsListSkeleton view={view} />
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : view === "grid" ? (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectGridCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <ProjectsTable projects={projects} />
      )}

      <NewProjectWizard open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="border-stroke-default text-content-tertiary flex flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed py-16 text-center">
      <p className="text-content-secondary text-sm font-medium">
        No projects found
      </p>
      <p className="text-xs">Try adjusting your filters or create a project.</p>
    </div>
  )
}

function ProjectsListSkeleton({ view }: { view: ProjectView }) {
  const cards = Array.from({ length: 6 })
  if (view === "list") {
    return (
      <div className="bg-surface-white border-stroke-light flex flex-col gap-3 rounded-[14px] border p-4">
        {cards.map((_, i) => (
          <div
            key={i}
            className="bg-surface-muted h-10 animate-pulse rounded-lg"
          />
        ))}
      </div>
    )
  }
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((_, i) => (
        <div
          key={i}
          className="bg-surface-white border-stroke-light h-44 animate-pulse rounded-[14px] border"
        />
      ))}
    </section>
  )
}
