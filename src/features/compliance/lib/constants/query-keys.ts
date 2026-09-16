import type { AccessMembersParams } from "../types/access"
import type { ComplianceAuditLogParams } from "../types/audit"
import type { CriticalAlertsParams } from "../types/overview"
import type { PoliciesListParams } from "../types/policies"
import type { RulesListParams } from "../types/rules"

export const complianceKeys = {
  overview: {
    all: ["compliance", "overview"] as const,
    score: () => [...complianceKeys.overview.all, "score"] as const,
    alerts: (params?: CriticalAlertsParams) =>
      [...complianceKeys.overview.all, "alerts", params] as const,
  },

  access: {
    all: ["compliance", "access"] as const,
    members: (params?: AccessMembersParams) =>
      [...complianceKeys.access.all, "members", params] as const,
    roles: () => [...complianceKeys.access.all, "roles"] as const,
    permissionMatrix: () =>
      [...complianceKeys.access.all, "permission-matrix"] as const,
  },

  policies: {
    all: ["compliance", "policies"] as const,
    list: (params?: PoliciesListParams) =>
      [...complianceKeys.policies.all, "list", params] as const,
  },

  audit: {
    all: ["compliance", "audit"] as const,
    list: (params?: ComplianceAuditLogParams) =>
      [...complianceKeys.audit.all, "list", params] as const,
  },

  rules: {
    all: ["compliance", "rules"] as const,
    list: (params?: RulesListParams) =>
      [...complianceKeys.rules.all, "list", params] as const,
    frameworks: () => [...complianceKeys.rules.all, "frameworks"] as const,
  },
}
