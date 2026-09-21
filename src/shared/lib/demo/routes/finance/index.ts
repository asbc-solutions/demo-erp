import type { DemoRoute } from "../../demo-router"

import "./collections"
import { financeAssistantRoutes } from "./assistant"
import { financeOverviewRoutes } from "./overview"
import { financePayablesRoutes } from "./payables"
import { financeReceivablesRoutes } from "./receivables"
import { financeShellRoutes } from "./shell"

/** Finance v2 endpoints, one file per section as each phase lands. */
export const financeRoutes: DemoRoute[] = [
  ...financeShellRoutes,
  ...financeOverviewRoutes,
  ...financeAssistantRoutes,
  ...financeReceivablesRoutes,
  ...financePayablesRoutes,
]
