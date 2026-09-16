"use client"

import { ChatTab } from "../../all-project/components/project-detail/chat-tab"
import { ProjectScopedView } from "../../components/project-scoped-view"
import { PortfolioActivityView } from "./portfolio-activity-view"

/**
 * Standalone Team Chat page. Defaults to the cross-project activity feed
 * (`GET /pm/activity`); picking a project narrows to that project's live
 * chat tab.
 */
export function TeamChatModule() {
  return (
    <ProjectScopedView renderAll={() => <PortfolioActivityView />}>
      {(projectId) => <ChatTab projectId={projectId} />}
    </ProjectScopedView>
  )
}
