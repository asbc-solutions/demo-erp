import { ChevronRight } from "lucide-react"
import { Link } from "@/src/i18n/navigation"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ProjectRow } from "../../lib/mappers/project-mapper"
import { initialsFromName } from "../../lib/mappers/project-mapper"
import { LIFECYCLE_STATUS_STYLE } from "../../all-project/data/all-projects-data"

export function ActiveProjectsCard({
  projects,
  isLoading,
}: {
  projects: ProjectRow[]
  isLoading?: boolean
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default flex flex-col gap-0.5 border-b px-5 py-3.5">
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          Active Projects
        </h2>
        <p className="text-content-tertiary text-[12px] leading-[17px]">
          {projects.length} projects in this view
        </p>
      </div>

      {isLoading ? (
        <ul className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="border-stroke-default border-b px-5 py-4">
              <div className="bg-surface-muted h-9 animate-pulse rounded-lg" />
            </li>
          ))}
        </ul>
      ) : projects.length === 0 ? (
        <p className="text-content-tertiary px-5 py-8 text-center text-sm">
          No active projects.
        </p>
      ) : (
        <ul className="flex flex-col">
          {projects.map((project) => {
            // Fall back so a project with an unrecognised status still renders
            // rather than taking the whole card down.
            const status =
              LIFECYCLE_STATUS_STYLE[project.status] ??
              LIFECYCLE_STATUS_STYLE.created
            return (
              <li key={project.id}>
                <Link
                  href={`/all-project/${project.id}`}
                  className="border-stroke-default hover:bg-surface-hover flex items-center gap-3 border-b px-5 py-4 transition-colors last:border-b-0"
                >
                  <span
                    className="bg-brand-primary flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] leading-5 font-semibold text-white"
                    aria-hidden
                  >
                    {initialsFromName(project.name)}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-content-primary truncate text-sm leading-5 font-medium">
                        {project.name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-0.5 text-[12px] leading-[17px] font-medium capitalize",
                          status.badge,
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", status.dot)}
                          aria-hidden
                        />
                        {project.statusLabel}
                      </span>
                    </div>
                    <span className="text-content-tertiary truncate text-[12px] leading-[17px]">
                      <span className="font-mono">{project.code}</span> ·{" "}
                      {project.startDate} → {project.endDate}
                    </span>
                  </div>

                  <ChevronRight
                    className="text-content-quaternary size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
