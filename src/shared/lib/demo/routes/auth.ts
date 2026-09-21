import type { PermissionsMap } from "../../types/permissions"
import { route, type DemoRoute } from "../demo-router"
import { resetCollections } from "../demo-db"

/**
 * Every RBAC slug declared across the feature `lib/constants/permissions.ts`
 * files. `rbac.util.ts` treats an unlisted resource as "none", so the demo has
 * to name each one explicitly or access gates would hide half the app.
 */
const RESOURCES = [
  "command_center",
  "compliance.access",
  "compliance.audit",
  "compliance.overview",
  "compliance.policies",
  "compliance.rules",
  "finance.overview",
  "finance.receivables",
  "finance.payables",
  "finance.banking",
  "finance.ledger",
  "finance.close",
  "finance.tax",
  "finance.assets",
  "finance.planning",
  "finance.reports",
  "finance.configuration",
  "operations.projects",
  "operations.tasks",
  "operations.vendors",
  "sales.access",
  "sales.crm_reflection",
  "sales.customer",
  "sales.export",
  "sales.invoice",
  "sales.notification",
  "sales.order",
  "sales.product",
  "sales.quotation",
  "sales.report",
  "sales.salesperson",
  "sales.settings",
  "settings.billing",
  "settings.company",
  "settings.integrations",
  "settings.team",
] as const

const FULL_ACCESS: PermissionsMap = Object.fromEntries(
  RESOURCES.map((resource) => [resource, "write" as const]),
)

const DEMO_USER = {
  id: 1,
  name: "Demo Admin",
  email: "admin@nucleus-demo.com",
  role: "HR Admin",
}

export const authRoutes: DemoRoute[] = [
  route("get", "/permissions/me", () => ({
    data: { user_id: DEMO_USER.id, permissions: FULL_ACCESS },
  })),

  route("get", "/auth/me", () => ({ data: DEMO_USER })),

  route("post", "/auth/logout", () => ({ data: null })),

  // Settings exposes a "reset demo data" action; make it mean something.
  route("post", "/settings/reset-demo-data", () => {
    resetCollections()
    return { data: { reset: true } }
  }),
]
