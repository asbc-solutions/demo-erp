import type { DemoRoute } from "../../demo-router"

import "./collections"
import { financeAssetRoutes } from "./assets"
import { withAudit } from "./audit-model"
import { financeAssistantRoutes } from "./assistant"
import { financeBankingRoutes } from "./banking"
import { financeCloseRoutes } from "./close"
import { financeConfigurationRoutes } from "./configuration"
import { financeLedgerRoutes } from "./ledger"
import { financeOverviewRoutes } from "./overview"
import { financePayablesRoutes } from "./payables"
import { financePlanningRoutes } from "./planning"
import { financeReconciliationRoutes } from "./reconciliation"
import { financeReportRoutes } from "./reports"
import { financeReceivablesRoutes } from "./receivables"
import { financeShellRoutes } from "./shell"
import { financeTaxRoutes } from "./tax"

/** Finance v2 endpoints, one file per section; every write leaves an audit event. */
export const financeRoutes: DemoRoute[] = withAudit([
  ...financeShellRoutes,
  ...financeOverviewRoutes,
  ...financeAssistantRoutes,
  ...financeReceivablesRoutes,
  ...financePayablesRoutes,
  ...financeBankingRoutes,
  ...financeReconciliationRoutes,
  ...financeLedgerRoutes,
  ...financeCloseRoutes,
  ...financeTaxRoutes,
  ...financeAssetRoutes,
  ...financePlanningRoutes,
  ...financeReportRoutes,
  ...financeConfigurationRoutes,
])
