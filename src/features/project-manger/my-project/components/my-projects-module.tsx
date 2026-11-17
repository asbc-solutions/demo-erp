"use client"

import { useMemo, useState } from "react"
import { Link } from "@/src/i18n/navigation"
import { Plus, Users } from "lucide-react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
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

/** Tab ids; each is a `ProjectsMyProjects.tab` message key. */
const MY_PROJECT_TABS = ["active", "allMine", "following", "archived"] as const

type MyProjectTab = (typeof MY_PROJECT_TABS)[number]

/** Each tab maps to a `GET /pm/me/projects` membership/status filter. */
const TAB_PARAMS: Record<MyProjectTab, MyProjectsParams> = {
  active: { status: "released" },
  allMine: {},
  following: { membership: "following" },
  archived: { status: "closed" },
}

type MyProjectsT = ReturnType<typeof useTranslations<"ProjectsMyProjects">>

function buildStats(stats: MyProjectsStats, t: MyProjectsT): MyProjectStat[] {
  return [
    {
      id: "managed",
      label: t("statManaged"),
      value: String(stats.managed_count),
      caption: t("statManagedCaption"),
      icon: "folder",
      accent: "indigo",
    },
    {
      id: "contributing",
      label: t("statContributing"),
      value: String(stats.contributing_count),
      caption: t("statContributingCaption"),
      icon: "activity",
      accent: "emerald",
    },
    {
      id: "following",
      label: t("statFollowing"),
      value: String(stats.following_count),
      caption: t("statFollowingCaption"),
      icon: "trending",
      accent: "blue",
    },
    {
      id: "health",
      label: t("statHealth"),
      value: `${stats.avg_health_pct}%`,
      caption:
        stats.avg_health_delta_pct != null
          ? t("statHealthDelta", {
              delta: `${stats.avg_health_delta_pct > 0 ? "+" : ""}${stats.avg_health_delta_pct}`,
            })
          : t("statHealthCaption"),
      icon: "health",
      accent: "emerald",
    },
  ]
}

export function MyProjectsModule() {
  const t = useTranslations("ProjectsMyProjects")
  const locale = useIntlLocale()
  const [tab, setTab] = useState<MyProjectTab>("active")
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

  const projects = useMemo(
    () => (data ?? []).map((item) => mapProjectRow(item, locale)),
    [data, locale],
  )
  const stats = useMemo(
    () => (statsQ.data ? buildStats(statsQ.data, t) : null),
    [statsQ.data, t],
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
              <Link href="/over-view">{t("breadcrumbModule")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-content-tertiary text-sm leading-5">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={() => setTab("following")}
          >
            <Users className="size-4" aria-hidden />
            {statsQ.data
              ? t("followingCount", { count: statsQ.data.following_count })
              : t("tab.following")}
          </Button>
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
              {t(`tab.${item}`)}
            </button>
          )
        })}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          stats.map((stat) => <MyProjectStatCard key={stat.id} stat={stat} />)
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
