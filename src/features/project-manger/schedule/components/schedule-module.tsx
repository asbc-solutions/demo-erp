"use client"

import { ScheduleTab } from "../../all-project/components/project-detail/schedule-tab"
import { ProjectScopedView } from "../../components/project-scoped-view"
import { PortfolioScheduleView } from "./portfolio-schedule-view"

/**
 * Standalone Schedule & Gantt page. Defaults to the cross-project milestone
 * summary (`GET /pm/schedule`); picking a project narrows to that project's
 * live Gantt tab.
 */
export function ScheduleModule() {
  return (
    <ProjectScopedView renderAll={() => <PortfolioScheduleView />}>
      {(projectId) => <ScheduleTab projectId={projectId} />}
    </ProjectScopedView>
  )
}
