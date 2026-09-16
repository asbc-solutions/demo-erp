export type NotificationType =
  | 'contract_expiry'
  | 'document_expiry'
  | 'probation_reminder'
  | 'overdue_task'
  | 'headcount_discrepancy'
  | 'budget_overage'
  | 'approval_required'
  | 'approval_decision'
  | 'general'

export type NotificationRelatedRecord = {
  type: string
  id: string
}

export type Notification = {
  id: string
  type: NotificationType
  type_label: string
  status: string
  status_label: string
  title: string
  message: string
  related_record: NotificationRelatedRecord | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export type NotificationListParams = {
  is_read?: boolean
  type?: NotificationType
  per_page?: number
  page?: number
}
