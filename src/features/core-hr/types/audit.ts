// Real API field names from GET /history and GET /employees/:id/history

export type AuditAction =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "LOGIN"
  | "EXPORT"
  | "STATUS_CHANGE"

export type AuditModule =
  | "HR"
  | "PAYROLL"
  | "RECRUITMENT"
  | "PERFORMANCE"
  | "LEAVE"
  | "TRAINING"
  | "BENEFITS"
  | "SYSTEM"

export type AuditEntry = {
  id: number
  action_type: string
  action_badge: AuditAction
  module_name: string
  module_badge: AuditModule
  table_name: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  description: string
  time_label: string
  changed_at: string
  changed_by_name?: string | null
  employee_name?: string | null
  employee_number?: string | null
  // Detail-only fields
  change_reason?: string | null
  employee_id?: string | null
  changed_by?: number | null
  ip_address?: string | null
  user_agent?: string | null
  date_label?: string
}

export type AuditDay = {
  date: string
  date_label: string
  entries: AuditEntry[]
}
