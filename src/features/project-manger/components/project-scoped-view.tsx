"use client"

import { useState, type ReactNode } from "react"
import { FolderKanban } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { useProjects } from "../lib/queries/projects"
import type { ProjectListItem } from "../lib/types"

/* ------------------------------------------------------------------ */
/* Scope hook                                                          */
/* ------------------------------------------------------------------ */

/**
 * Resolves the "current project" for the standalone (non-detail) PM pages.
 * The list endpoint has no per-user scoping yet (see FRONTEND_PM_PROGRESS.md),
 * so it lists all active projects and defaults the selection to the first one.
 */
export function useProjectScope() {
  const { data, isLoading, isError } = useProjects({
    is_active: true,
    per_page: 100,
  })
  const projects = data?.data ?? []

  // Derive the effective selection (defaults to the first project) rather than
  // syncing it in an effect — `picked` only holds an explicit user choice.
  const [picked, setPicked] = useState<string | null>(null)
  const projectId = picked ?? projects[0]?.id ?? null
  const selected = projects.find((p) => p.id === projectId) ?? null

  return {
    projects,
    projectId,
    setProjectId: setPicked,
    selected,
    isLoading,
    isError,
  }
}

/* ------------------------------------------------------------------ */
/* Selector bar                                                        */
/* ------------------------------------------------------------------ */

const ALL_PROJECTS = "__all__"

export function ProjectScopeBar({
  projects,
  projectId,
  onChange,
  isLoading,
  className,
  allowAll,
  allSelected,
  onSelectAll,
}: {
  projects: ProjectListItem[]
  projectId: string | null
  onChange: (id: string) => void
  isLoading?: boolean
  className?: string
  /** Adds an "All projects" option (portfolio scope). */
  allowAll?: boolean
  allSelected?: boolean
  onSelectAll?: () => void
}) {
  const t = useTranslations("ProjectsShared")
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <FolderKanban className="text-content-tertiary size-4" aria-hidden />
      <span className="text-content-tertiary text-xs font-medium">
        {t("projectLabel")}
      </span>
      <Select
        value={allSelected ? ALL_PROJECTS : (projectId ?? undefined)}
        onValueChange={(value) => {
          if (value === ALL_PROJECTS) onSelectAll?.()
          else onChange(value)
        }}
        disabled={isLoading || (projects.length === 0 && !allowAll)}
      >
        <SelectTrigger className="h-9 w-[260px] text-[13px]">
          <SelectValue
            placeholder={isLoading ? t("loadingProjects") : t("selectProject")}
          />
        </SelectTrigger>
        <SelectContent>
          {allowAll ? (
            <SelectItem value={ALL_PROJECTS}>{t("allProjects")}</SelectItem>
          ) : null}
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page shell                                                          */
/* ------------------------------------------------------------------ */

/**
 * Wraps a project-scoped standalone page: renders the selector bar, resolves a
 * project, and calls `children(projectId)` once one is available. Handles the
 * loading / error / no-projects states so each page stays focused on its body.
 *
 * Pass `renderAll` to add an "All projects" option to the selector — it is the
 * default scope and renders the portfolio view instead of `children`.
 */
export function ProjectScopedView({
  title,
  subtitle,
  actions,
  children,
  renderAll,
}: {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: (projectId: string) => ReactNode
  renderAll?: () => ReactNode
}) {
  const t = useTranslations("ProjectsShared")
  const { projects, projectId, setProjectId, isLoading, isError } =
    useProjectScope()

  // Portfolio-capable pages open on "All projects"; picking one narrows scope.
  const [allSelected, setAllSelected] = useState(!!renderAll)

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {title ? (
            <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="text-content-tertiary text-sm">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <ProjectScopeBar
            projects={projects}
            projectId={projectId}
            onChange={(id) => {
              setAllSelected(false)
              setProjectId(id)
            }}
            isLoading={isLoading}
            allowAll={!!renderAll}
            allSelected={!!renderAll && allSelected}
            onSelectAll={() => setAllSelected(true)}
          />
        </div>
      </header>

      {renderAll && allSelected ? (
        renderAll()
      ) : isError ? (
        <div className="border-stroke-default bg-surface-white flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-[14px] border p-6 text-center">
          <p className="text-content-secondary text-sm font-medium">
            {t("loadProjectsFailed")}
          </p>
          <p className="text-content-tertiary text-xs">
            {t("loadProjectsFailedDescription")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-surface-muted h-[40vh] w-full animate-pulse rounded-[14px]" />
      ) : !projectId ? (
        <div className="border-stroke-default bg-surface-white flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-[14px] border p-6 text-center">
          <p className="text-content-secondary text-sm font-medium">
            {t("noProjectsTitle")}
          </p>
          <p className="text-content-tertiary text-xs">
            {t("noProjectsDescription")}
          </p>
        </div>
      ) : (
        children(projectId)
      )}
    </div>
  )
}
