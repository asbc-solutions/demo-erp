"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { LayoutGrid, List, Plus, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useIntlLocale } from "@/src/i18n/intl-locale"
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

type AllProjectsT = ReturnType<typeof useTranslations<"ProjectsAllProjects">>

const VIEW_OPTIONS: {
  id: ProjectView
  labelKey: "viewGrid" | "viewList"
  icon: typeof LayoutGrid
}[] = [
  { id: "grid", labelKey: "viewGrid", icon: LayoutGrid },
  { id: "list", labelKey: "viewList", icon: List },
]

const INITIAL_FILTERS: ProjectFilterState = {
  search: "",
  status: "all",
  projectType: "all",
}

function buildStats(stats: ProjectStats, t: AllProjectsT): ProjectStat[] {
  return [
    {
      id: "total",
      label: t("statTotal"),
      value: String(stats.total),
      caption: t("statTotalCaption", { count: stats.new_this_month }),
      icon: "folder",
      accent: "indigo",
    },
    {
      id: "active",
      label: t("statActive"),
      value: String(stats.active_count),
      caption: t("statActiveCaption"),
      icon: "zap",
      accent: "emerald",
    },
    {
      id: "at-risk",
      label: t("statAtRisk"),
      value: String(stats.at_risk_count),
      caption: t("statAtRiskCaption"),
      icon: "alert",
      accent: "amber",
    },
    {
      id: "overdue",
      label: t("statOverdue"),
      value: String(stats.overdue_count),
      caption: t("statOverdueCaption"),
      icon: "clock",
      accent: "red",
    },
  ]
}

export function AllProjectsModule() {
  const t = useTranslations("ProjectsAllProjects")
  const locale = useIntlLocale()
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
    () => (statsQ.data ? buildStats(statsQ.data, t) : null),
    [statsQ.data, t],
  )

  const handleImportFile = (file: File) => {
    importProjects.mutate(file, {
      onSuccess: (result) => {
        toast.success(t("importSuccess", { count: result.created }), {
          description:
            result.errors.length > 0
              ? t("importSkippedWithErrors", {
                  skipped: result.skipped,
                  failed: result.errors.length,
                })
              : t("importSkipped", { skipped: result.skipped }),
        })
      },
      onError: (err) =>
        toast.error(t("importFailed"), {
          description: (err as unknown as ApiError).message,
        }),
    })
  }

  useEffect(() => {
    if (isError) {
      const message =
        (error as { message?: string })?.message ?? t("loadFailed")
      toast.error(message)
    }
  }, [isError, error, t])

  const projects = useMemo(
    () => (data?.data ?? []).map((item) => mapProjectRow(item, locale)),
    [data, locale],
  )

  const handleFilterChange = (patch: Partial<ProjectFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }))

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-content-tertiary text-sm leading-5">
            {t("subtitle")}
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
            {importProjects.isPending ? t("importing") : t("import")}
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
                  {t(option.labelKey)}
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
            {t("newProject")}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          stats.map((stat) => <AllProjectsStatCard key={stat.id} stat={stat} />)
        ) : statsQ.isError ? (
          <p className="text-content-tertiary col-span-full py-4 text-sm">
            {t("statsLoadFailed")}
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
  const t = useTranslations("ProjectsAllProjects")
  return (
    <div className="border-stroke-default text-content-tertiary flex flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed py-16 text-center">
      <p className="text-content-secondary text-sm font-medium">
        {t("emptyTitle")}
      </p>
      <p className="text-xs">{t("emptyDescription")}</p>
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
