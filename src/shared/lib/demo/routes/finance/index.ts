import type { DemoRoute } from "../../demo-router"

import "./collections"
import { financeShellRoutes } from "./shell"

/** Finance v2 endpoints, one file per section as each phase lands. */
export const financeRoutes: DemoRoute[] = [...financeShellRoutes]
