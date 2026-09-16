export type AuditLogListParams = {
  page?: number
  per_page?: number
  employee_id?: string
  module_name?: string
  table_name?: string
  action_type?: string
  changed_by?: number
  date_from?: string
  date_to?: string
}

export type AuditHistoryMeta = {
  current_page: number
  per_page: number
  total_entries: number
  last_page: number
}
