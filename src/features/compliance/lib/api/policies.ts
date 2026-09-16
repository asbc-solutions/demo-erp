import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type {
  AcknowledgePolicyResult,
  CompliancePolicy,
  CreatePolicyPayload,
  PoliciesListParams,
} from "../types/policies"

export const compliancePoliciesApi = {
  list: (params?: PoliciesListParams) =>
    httpClient.get<ApiResponse<CompliancePolicy[]> & { meta: PaginationMeta }>(
      "/compliance/policies",
      { params },
    ),

  create: (payload: CreatePolicyPayload) =>
    httpClient.post<ApiResponse<CompliancePolicy>>("/compliance/policies", payload),

  /** Idempotent — repeat calls don't bump the counter or error. */
  acknowledge: (id: string) =>
    httpClient.post<ApiResponse<AcknowledgePolicyResult>>(
      `/compliance/policies/${id}/acknowledge`,
    ),
}
