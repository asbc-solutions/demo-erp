"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"

import { EmployeeNotLinkedAlert } from "../../components/employee-not-linked-alert"
import { useMySummary } from "../../lib/queries/my-work"
import type { MySummary } from "../../lib/types"
import { isUnlinkedEmployeeError } from "../../lib/utils/errors"

import { MyCapacityCard } from "./my-capacity-card"
import { MyProjectsCard } from "./my-projects-card"
import { NewProjectWizard } from "./new-project-wizard"
import { OverviewStatCard, type OverviewStat } from "./overview-stat-card"
import { RecentActivityCard } from "./recent-activity-card"
import { SendWeeklyDigestDialog } from "./send-weekly-digest-dialog"
import { TodaysPrioritiesCard } from "./todays-priorities-card"

function buildStats(summary: MySummary): OverviewStat[] {
  const { active_projects, tasks_due_today, hours_this_week, approvals_pending } =
    summary
  return [
    {
      id: "active-projects",
      label: "Active Projects",
      value: String(active_projects.count),
      caption: `${active_projects.on_track} on track · ${active_projects.needs_attention} need attention`,
      icon: "folder",
      accent: "indigo",
    },
    {
      id: "tasks-due",
      label: "Tasks Due Today",
      value: String(tasks_due_today.count),
      caption: `${tasks_due_today.high_priority} high priority`,
      icon: "check",
      accent: "amber",
    },
    {
      id: "hours-week",
      label: "Hours This Week",
      value: `${hours_this_week.booked} / ${hours_this_week.capacity}`,
      caption: `${hours_this_week.remaining}h remaining capacity`,
      icon: "clock",
      accent: "emerald",
    },
    {
      id: "approvals",
      label: "Approvals Pending",
      value: String(approvals_pending.count),
      caption: `${approvals_pending.gates} gates · ${approvals_pending.change_requests} change requests`,
      icon: "flag",
      accent: "red",
    },
  ]
}

function greetingForNow(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function OverviewModule() {
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [digestOpen, setDigestOpen] = useState(false)

  const summary = useMySummary()
  const stats = useMemo(
    () => (summary.data ? buildStats(summary.data) : null),
    [summary.data],
  )

  const now = new Date()
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
            {greetingForNow(now)}
          </h1>
          <p className="text-content-tertiary text-sm leading-6">
            {dateLabel} · Here&apos;s what needs your attention today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="h-9 px-3 text-[12px]"
            onClick={() => setDigestOpen(true)}
          >
            Send Weekly Digest
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

      {summary.isError && isUnlinkedEmployeeError(summary.error) && (
        <EmployeeNotLinkedAlert />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          stats.map((stat) => <OverviewStatCard key={stat.id} stat={stat} />)
        ) : summary.isError ? (
          <p className="text-content-tertiary col-span-full py-4 text-sm">
            Couldn&apos;t load your summary.
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
          <TodaysPrioritiesCard />
        </div>
        <MyCapacityCard />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MyProjectsCard />
        </div>
        <RecentActivityCard />
      </section>

      <NewProjectWizard open={newProjectOpen} onOpenChange={setNewProjectOpen} />
      <SendWeeklyDigestDialog open={digestOpen} onOpenChange={setDigestOpen} />
    </div>
  )
}
