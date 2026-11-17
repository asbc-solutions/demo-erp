"use client"

import { useState } from "react"
import { Link } from "@/src/i18n/navigation"
import { CalendarDays, ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/ui/tabs"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { useReleaseProject } from "../../../lib/mutations/projects"
import { useProject } from "../../../lib/queries/projects"
import {
  PROJECT_TYPE_LABEL,
  formatApiDate,
} from "../../../lib/mappers/project-mapper"
import type { ProjectLifecycleStatus } from "../../../lib/types"
import { TYPE_STYLE } from "../../data/all-projects-data"
import { PROJECT_TABS, type ProjectTab } from "../../data/project-detail-data"

import { BudgetTab } from "./budget-tab"
import { ChatTab } from "./chat-tab"
import { DocumentsTab } from "./documents-tab"
import { OverviewTab } from "./overview-tab"
import { ReportsTab } from "./reports-tab"
import { ResourcesTab } from "./resources-tab"
import { ScheduleTab } from "./schedule-tab"
import { StatusPill } from "./status-pill"
import { TasksTab } from "./tasks-tab"
import { WbsTab } from "./wbs-tab"

const TAB_CONTENT: Record<ProjectTab, React.ComponentType<{ projectId: string }>> =
  {
    overview: OverviewTab,
    wbs: WbsTab,
    schedule: ScheduleTab,
    resources: ResourcesTab,
    budget: BudgetTab,
    tasks: TasksTab,
    documents: DocumentsTab,
    chat: ChatTab,
    reports: ReportsTab,
  }

const KNOWN_LIFECYCLE: ProjectLifecycleStatus[] = [
  "created",
  "released",
  "technically_complete",
  "closed",
]

export function ProjectDetailShell({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsProjectDetail")
  const tShared = useTranslations("ProjectsShared")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const [tab, setTab] = useState<ProjectTab>("overview")
  const { data: project, isLoading, isError } = useProject(projectId)
  const releaseProject = useReleaseProject()

  const handleRelease = () => {
    releaseProject.mutate(projectId, {
      onSuccess: () => toast.success(t("releaseSuccess")),
      onError: (err) =>
        toast.error(t("releaseFailed"), {
          description: (err as unknown as ApiError).message,
        }),
    })
  }

  if (isLoading) {
    return (
      <div className="bg-surface-page flex min-h-[60vh] items-center justify-center">
        <div className="bg-surface-muted h-24 w-full max-w-xl animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-content-secondary text-sm font-medium">
          {t("notFound")}
        </p>
        <Link
          href="/all-project"
          className="text-brand-primary text-xs font-medium hover:underline"
        >
          {t("backToAll")}
        </Link>
      </div>
    )
  }

  const typeLabel = PROJECT_TYPE_LABEL[project.project_type] ?? "Internal"
  const statusLabel = KNOWN_LIFECYCLE.includes(project.status)
    ? tShared(`lifecycle.${project.status}`)
    : project.status_label

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as ProjectTab)}
      className="gap-0"
    >
      <div className="bg-surface-white px-6 pt-4">
        <Link
          href="/all-project"
          className="text-content-tertiary hover:text-content-primary inline-flex items-center gap-1 text-xs font-medium transition-colors"
        >
          <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {t("backToAll")}
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-content-primary text-2xl leading-7 font-bold tracking-tight">
                {project.name}
              </h1>
              <StatusPill status={project.status_label} label={statusLabel} />
              <span
                className={cn("text-xs font-medium", TYPE_STYLE[typeLabel])}
              >
                {tShared(`projectType.${project.project_type}`)}
              </span>
            </div>
            <div className="text-content-tertiary flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="font-mono">{project.project_code}</span>
              <span className="flex items-center gap-1.5">
                <Avatar
                  color="neutral"
                  className="size-[18px] text-[9px] leading-none"
                >
                  ?
                </Avatar>
                {project.manager_id ? t("managerAssigned") : "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden />
                {tShared("dateRange", {
                  start: formatApiDate(project.start_date, locale),
                  end: formatApiDate(project.end_date, locale),
                })}
              </span>
              <span>
                {t.rich("customer", {
                  customer: project.customer_id ?? "—",
                  value: (chunks) => (
                    <span className="text-content-secondary font-semibold">
                      {chunks}
                    </span>
                  ),
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-3 text-[12px]">
              {t("share")}
            </Button>
            <Button variant="outline" className="h-9 px-3 text-[12px]">
              {tCommon("edit")}
            </Button>
            {project.status === "created" && (
              <Button
                variant="primary"
                className="h-9 px-3 text-[12px]"
                onClick={handleRelease}
                disabled={releaseProject.isPending}
              >
                {releaseProject.isPending ? t("releasing") : t("release")}
              </Button>
            )}
          </div>
        </div>

        <TabsList className="mt-4 w-full overflow-x-auto">
          {PROJECT_TABS.map((item) => (
            <TabsTrigger key={item} value={item}>
              {t(`tabs.${item}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="bg-surface-page min-h-[calc(100vh-200px)] p-6">
        {PROJECT_TABS.map((item) => {
          const Content = TAB_CONTENT[item]
          return (
            <TabsContent key={item} value={item}>
              <Content projectId={projectId} />
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
}
