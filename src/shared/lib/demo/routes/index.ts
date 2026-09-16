import type { DemoRoute } from "../demo-router"

import { authRoutes } from "./auth"
import { commandCenterRoutes } from "./command-center"
import { coreHrRoutes } from "./core-hr"
import { salesRoutes } from "./sales"
import { financeRoutes } from "./finance"
import { operationsRoutes } from "./operations"
import { complianceRoutes } from "./compliance"
import { settingsRoutes } from "./settings"
import { integrationsRoutes } from "./integrations"
import { projectManagerRoutes } from "./project-manger"

/**
 * Checked in order, so more specific patterns must come first. Anything not
 * matched here falls through to the generic CRUD handler in `demo-adapter.ts`.
 */
export const DEMO_ROUTES: DemoRoute[] = [
  ...authRoutes,
  ...commandCenterRoutes,
  ...coreHrRoutes,
  ...salesRoutes,
  ...financeRoutes,
  ...operationsRoutes,
  ...complianceRoutes,
  ...settingsRoutes,
  ...integrationsRoutes,
  ...projectManagerRoutes,
]
