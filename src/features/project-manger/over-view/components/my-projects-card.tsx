"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { formatMoney } from "../../lib/mappers/cost-budget-mapper"
import { initialsFromName } from "../../lib/mappers/project-mapper"
import { useMyProjects } from "../../lib/queries/my-work"

const HEALTH_STYLE: Record<string, { badge: string; dot: string }> = {
  "On Track": {
    badge: "bg-brand-success/12 text-brand-success",
    dot: "bg-brand-success",
  },
  "At Risk": {
    badge: "bg-brand-warning/12 text-brand-warning",
    dot: "bg-brand-warning",
  },
  Critical: {
    badge: "bg-brand-danger/12 text-brand-danger",
    dot: "bg-brand-danger",
  },
}

const AVATAR_STYLES = [
  "bg-brand-primary/12 text-brand-primary",
  "bg-brand-info/12 text-brand-info",
  "bg-brand-danger/12 text-brand-danger",
  "bg-brand-success/12 text-brand-success",
  "bg-brand-warning/12 text-brand-warning",
]

/** Deterministic avatar style from an id so a project keeps its colour. */
function avatarStyleForId(id: string): string {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return AVATAR_STYLES[sum % AVATAR_STYLES.length]
}

export function MyProjectsCard() {
  const { data, isLoading, isError } = useMyProjects({ per_page: 5 })
  const projects = data ?? []

  const totalBudget = projects.reduce(
    (sum, p) => sum + (p.budget_amount ?? 0),
    0,
  )
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent ?? 0), 0)

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            My Projects
          </h2>
          <p className="text-content-tertiary text-[12px] leading-[17px]">
            {isLoading
              ? "Loading…"
              : `${projects.length} active · ${formatMoney(totalBudget)} total · ${formatMoney(totalSpent)} spent`}
          </p>
        </div>
        <Link
          href="/my-project"
          className="text-brand-primary hover:text-brand-primary-hover text-[12px] leading-[18px] font-medium transition-colors"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-16 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          Couldn&apos;t load your projects.
        </p>
      ) : projects.length === 0 ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          You aren&apos;t assigned to any projects yet.
        </p>
      ) : (
        <ul className="flex flex-col">
          {projects.map((project) => {
            const status =
              HEALTH_STYLE[project.health_status] ?? HEALTH_STYLE["On Track"]
            return (
              <li key={project.id}>
                <Link
                  href={`/all-project/${project.id}`}
                  className="border-stroke-default hover:bg-surface-hover flex items-center gap-3 border-b px-5 py-4 transition-colors last:border-b-0"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] leading-5 font-semibold",
                      avatarStyleForId(project.id),
                    )}
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
                          "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-0.5 text-[12px] leading-[17px] font-medium",
                          status.badge,
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", status.dot)}
                          aria-hidden
                        />
                        {project.health_status}
                      </span>
                    </div>
                    <span className="text-content-tertiary truncate text-[12px] leading-[17px]">
                      {project.project_code}
                      {project.manager_name ? ` · ${project.manager_name}` : ""}
                    </span>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="bg-surface-active h-1.5 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-brand-primary h-full rounded-full transition-all"
                          style={{ width: `${project.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-content-tertiary shrink-0 text-[12px] leading-[17px] font-medium tabular-nums">
                        {project.progress ?? 0}%
                      </span>
                    </div>
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
