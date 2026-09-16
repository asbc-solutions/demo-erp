"use client"

import { useQuery } from "@tanstack/react-query"
import { auditLogApi } from "../api/audit-log"
import { coreHrKeys } from "../constants/query-keys"
import type { AuditLogListParams } from "../types"

export function useAuditLog(params?: AuditLogListParams) {
  return useQuery({
    queryKey: coreHrKeys.auditLog.list(params),
    queryFn: () =>
      auditLogApi.list(params).then((r) => ({
        days: r.data.data,
        meta: r.data.meta,
      })),
  })
}

export function useEmployeeHistory(employeeId: string, limit = 100) {
  return useQuery({
    queryKey: [...coreHrKeys.employees.detail(employeeId), "history", limit],
    queryFn: () =>
      auditLogApi.byEmployee(employeeId, limit).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}

export function useHistoryDetail(id: number) {
  return useQuery({
    queryKey: [...coreHrKeys.auditLog.all, "detail", id],
    queryFn: () => auditLogApi.detail(id).then((r) => r.data.data),
    enabled: id > 0,
  })
}
