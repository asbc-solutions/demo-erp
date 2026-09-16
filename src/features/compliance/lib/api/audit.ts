import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type { ComplianceAuditEvent, ComplianceAuditLogParams } from "../types/audit"

export const complianceAuditApi = {
  list: (params?: ComplianceAuditLogParams) =>
    httpClient.get<ApiResponse<ComplianceAuditEvent[]> & { meta: PaginationMeta }>(
      "/compliance/audit-log",
      { params },
    ),
}
