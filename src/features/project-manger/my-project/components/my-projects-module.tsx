"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Users } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/shared/components/ui/breadcrumb"
import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

import { EmployeeNotLinkedAlert } from "../../components/employee-not-linked-alert"
import { NewProjectWizard } from "../../over-view/components/new-project-wizard"
import { SendWeeklyDigestDialog } from "../../over-view/components/send-weekly-digest-dialog"
import { mapProjectRow } from "../../lib/mappers/project-mapper"
import { useMyProjects, useMyProjectsStats } from "../../lib/queries/my-work"
import type { MyProjectsParams, MyProjectsStats } from "../../lib/types"
import { isUnlinkedEmployeeError } from "../../lib/utils/errors"

import { ActiveProjectsCard } from "./active-projects-card"
import { LogTimeDialog } from "./log-time-dialog"
import { MyProjectStatCard, type MyProjectStat } from "./my-project-stat-card"
import { QuickActionsCard, type QuickActionId } from "./quick-actions-card"
import { SubmitExpenseDialog } from "./submit-expense-dialog"
import { UpcomingMilestonesCard } from "./upcoming-milestones-card"
import { UpdateStatusDialog } from "./update-status-dialog"

const MY_PROJECT_TABS = ["Active", "All Mine", "Following", "Archived"] as const

type MyProjectTab = (typeof MY_PROJECT_TABS)[number]

/** Each tab maps to a `GET /pm/me/projects` membership/status filter. */
const TAB_PARAMS: Record<MyProjectTab, MyProjectsParams> = {
  Active: { status: "released" },
  "All Mine": {},
  Following: { membership: "following" },
  Archived: { status: "closed" },
}

function buildStats(stats: MyProjectsStats): MyProjectStat[] {
  return [
    {
      id: "managed",
      label: "Managed by me",
      value: String(stats.managed_count),
      caption: "As Project Manager",
      icon: "folder",
      accent: "indigo",
    },
    {
      id: "contributing",
      label: "Contributing",
      value: String(stats.contributing_count),
      caption: "As team member",
      icon: "activity",
      accent: "emerald",
    },
    {
      id: "following",
      label: "Following",
      value: String(stats.following_count),
      caption: "Watch only",
      icon: "trending",
      accent: "blue",
    },
    {
      id: "health",
      label: "Avg Health",
      value: `${stats.avg_health_pct}%`,
      caption:
        stats.avg_health_delta_pct != null
          ? `${stats.avg_health_delta_pct > 0 ? "+" : ""}${stats.avg_health_delta_pct}% vs last month`
          : "Across my projects",
      icon: "health",
      accent: "emerald",
    },
  ]
}

export function MyProjectsModule() {
  const [tab, setTab] = useState<MyProjectTab>("Active")
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [logTimeOpen, setLogTimeOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  const statsQ = useMyProjectsStats()
  const { data, isLoading } = useMyProjects({
    ...TAB_PARAMS[tab],
    per_page: 25,
  })

  const projects = useMemo(() => (data ?? []).map(mapProjectRow), [data])
  const stats = useMemo(
    () => (statsQ.data ? buildStats(statsQ.data) : null),
    [statsQ.data],
  )

  const handleQuickAction = (id: QuickActionId) => {
    if (id === "log-time") setLogTimeOpen(true)
    else if (id === "submit-report") setReportOpen(true)
    else if (id === "update-status") setStatusOpen(true)
    else if (id === "file-expense") setExpenseOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/over-view">PM Module</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Projects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
            My Projects
          </h1>
          <p className="text-content-tertiary text-sm leading-5">
            Projects you manage, contribute to, or follow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={() => setTab("Following")}
          >
            <Users className="size-4" aria-hidden />
            Following{statsQ.data ? ` (${statsQ.data.following_count})` : ""}
          </Button>
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

      {statsQ.isError && isUnlinkedEmployeeError(statsQ.error) && (
        <EmployeeNotLinkedAlert />
      )}

      <div className="bg-surface-white border-stroke-default flex w-fit items-center gap-0.5 rounded-xl border p-1">
        {MY_PROJECT_TABS.map((item) => {
          const isActive = item === tab
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "inline-flex h-[26px] items-center rounded-lg px-3 text-[12px] leading-[18px] font-medium transition-colors",
                isActive
                  ? "bg-surface-page text-content-primary shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                  : "text-content-tertiary hover:text-content-primary",
              )}
            >
              {item}
            </button>
          )
        })}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          stats.map((stat) => <MyProjectStatCard key={stat.id} stat={stat} />)
        ) : statsQ.isError ? (
          <p className="text-content-tertiary col-span-full py-4 text-sm">
            Couldn&apos;t load your project stats.
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActiveProjectsCard
            projects={projects}
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-col gap-4">
          <UpcomingMilestonesCard />
          <QuickActionsCard onAction={handleQuickAction} />
        </div>
      </section>

      <NewProjectWizard open={newProjectOpen} onOpenChange={setNewProjectOpen} />
      <LogTimeDialog open={logTimeOpen} onOpenChange={setLogTimeOpen} />
      <SendWeeklyDigestDialog open={reportOpen} onOpenChange={setReportOpen} />
      <UpdateStatusDialog open={statusOpen} onOpenChange={setStatusOpen} />
      <SubmitExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  )
}
