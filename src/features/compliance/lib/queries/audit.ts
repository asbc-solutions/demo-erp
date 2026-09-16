"use client"

import { useQuery } from "@tanstack/react-query"

import { complianceAuditApi } from "../api/audit"
import { complianceKeys } from "../constants/query-keys"
import type { ComplianceAuditLogParams } from "../types/audit"

export function useComplianceAuditLog(params?: ComplianceAuditLogParams) {
  return useQuery({
    queryKey: complianceKeys.audit.list(params),
    queryFn: () => complianceAuditApi.list(params).then((r) => r.data),
  })
}
