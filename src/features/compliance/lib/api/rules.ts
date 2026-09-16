import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type {
  ComplianceFramework,
  ComplianceRule,
  RulesListParams,
  UpdateRulePayload,
} from "../types/rules"

export const complianceRulesApi = {
  list: (params?: RulesListParams) =>
    httpClient.get<ApiResponse<ComplianceRule[]> & { meta: PaginationMeta }>(
      "/compliance/rules",
      { params },
    ),

  /** Configurable list from `compliance_frameworks` — not a fixed enum. */
  listFrameworks: () =>
    httpClient.get<ApiResponse<ComplianceFramework[]>>("/compliance/rules/frameworks"),

  update: (id: string, payload: UpdateRulePayload) =>
    httpClient.patch<ApiResponse<ComplianceRule>>(`/compliance/rules/${id}`, payload),
}
