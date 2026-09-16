"use client"

import { WbsTab } from "../../all-project/components/project-detail/wbs-tab"
import { ProjectScopedView } from "../../components/project-scoped-view"
import { WbsIndexView } from "./wbs-index-view"

/**
 * Standalone Work Breakdown page. Defaults to the cross-project WBS summary
 * (`GET /pm/wbs/summary`); picking a project narrows to that project's live
 * WBS tree.
 */
export function WbsModule() {
  return (
    <ProjectScopedView renderAll={() => <WbsIndexView />}>
      {(projectId) => <WbsTab projectId={projectId} />}
    </ProjectScopedView>
  )
}
