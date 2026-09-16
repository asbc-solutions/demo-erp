/**
 * Wire types for GET /compliance/audit-log (bruno/Compliance/Audit/*.bru).
 *
 * This reads from the same `employee_history` table as Core HR's audit log and
 * the Command Center activity feed — one event stream, not a compliance-only copy.
 * `status` is derived client-unaware-ly by the backend from `action`
 * (reject → failure, delete → warning, else → success); always render `status`
 * and the `*_label` fields as given, never re-derive them.
 */

export type AuditActionType =
  | "insert"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "login"
  | "export"
  | "status_change"

export type AuditStatus = "success" | "failure" | "warning"

export type ComplianceAuditEvent = {
  id: number
  actor: string
  actor_id: number | null
  action: string
  action_label: string
  module: string
  module_label: string
  subject: string
  description: string
  when: string
  ip: string | null
  status: AuditStatus
}

export type ComplianceAuditLogParams = {
  module_name?: string
  actor?: number
  action_type?: AuditActionType
  table_name?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}
