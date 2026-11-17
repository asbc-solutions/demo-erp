import { Link } from "@/src/i18n/navigation"
import { Layers, ListChecks } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Progress } from "@/src/shared/components/ui/progress"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ProjectRow } from "../../lib/mappers/project-mapper"
import { initialsFromName } from "../../lib/mappers/project-mapper"
import { ACCENT_BORDER_TOP, TYPE_STYLE } from "../data/all-projects-data"

import { ProjectStatusBadge } from "./project-status-badge"

/** Health level → top-accent colour. */
const HEALTH_ACCENT = {
  "On Track": "indigo",
  "At Risk": "amber",
  Critical: "red",
} as const

export function ProjectGridCard({ project }: { project: ProjectRow }) {
  const t = useTranslations("ProjectsAllProjects")
  const tShared = useTranslations("ProjectsShared")
  const hasProgress = typeof project.progress === "number"
  const accent = project.health ? HEALTH_ACCENT[project.health] : "indigo"

  return (
    <Link
      href={`/all-project/${project.id}`}
      className={cn(
        "bg-surface-white border-stroke-light focus-visible:ring-brand-primary/30 flex flex-col rounded-[14px] border border-t-2 px-5 pt-[22px] pb-5 shadow-[0px_1px_1.5px_0px_rgba(0,0,0,0.06)] transition-shadow outline-none hover:shadow-md focus-visible:ring-2",
        ACCENT_BORDER_TOP[accent],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[11px] leading-[16.5px] font-medium",
            TYPE_STYLE[project.typeLabel],
          )}
        >
          {tShared(`projectType.${project.type}`)}
        </span>
        <ProjectStatusBadge status={project.status} label={project.statusLabel} />
      </div>

      <h3 className="text-content-primary mt-3 truncate text-base leading-[20.8px] font-semibold">
        {project.name}
      </h3>
      <p className="text-content-tertiary mt-1 truncate text-xs leading-[18px]">
        {project.org ? `${project.org} · ` : ""}
        <span className="font-mono">{project.code}</span>
      </p>

      <Progress
        value={project.progress ?? 0}
        color="indigo"
        className="bg-surface-muted mt-[14px] h-1.5"
      />

      <div className="mt-1.5 flex items-center justify-between text-[11px] leading-[16.5px]">
        <span>
          {t.rich("percentComplete", {
            percent: hasProgress ? `${project.progress}%` : "—",
            value: (chunks) => (
              <span className="text-content-primary font-semibold">{chunks}</span>
            ),
            label: (chunks) => (
              <span className="text-content-tertiary font-medium">{chunks}</span>
            ),
          })}
        </span>
        <span className="text-content-tertiary">
          {project.endDate ? t("due", { date: project.endDate }) : "—"}
        </span>
      </div>

      <div className="border-stroke-light mt-4 flex items-center justify-between border-t pt-[13px]">
        <div className="flex items-center gap-2">
          <Avatar
            color="neutral"
            className="size-[22px] text-[10px] leading-[15px]"
          >
            {project.manager ? initialsFromName(project.manager.name) : "?"}
          </Avatar>
          <span className="text-content-secondary text-xs leading-[18px] font-medium">
            {project.manager?.name ?? "—"}
          </span>
        </div>
        <span className="text-content-secondary text-xs leading-[18px] font-semibold">
          {project.budget ?? "—"}
        </span>
      </div>

      {(typeof project.phases === "number" ||
        typeof project.tasksTotal === "number") && (
        <div className="text-content-tertiary mt-2 flex items-center gap-3 text-[11px] leading-[16.5px]">
          {typeof project.phases === "number" && (
            <span className="flex items-center gap-1">
              <Layers className="size-[11px]" aria-hidden />
              {t("phasesCount", { count: project.phases })}
            </span>
          )}
          {typeof project.tasksTotal === "number" && (
            <span className="flex items-center gap-1">
              <ListChecks className="size-[11px]" aria-hidden />
              {t("tasksProgress", {
                done: project.tasksDone ?? 0,
                total: project.tasksTotal,
              })}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
