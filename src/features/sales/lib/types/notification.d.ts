/**
 * Only `payment_recorded` is confirmed as a literal `type` value in the
 * Bruno docs; other likely values (quotation sent/accepted/rejected/expired,
 * discount-approval requested/decided, order confirmed/blocked, invoice
 * issued/cancelled) are named in prose but not spelled out as enum strings.
 * Kept as `string` rather than a closed union until confirmed live.
 */
export type SalesNotification = {
  id: string
  type: string
  type_label: string
  payload: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export type NotificationListParams = {
  unread_only?: boolean
  page?: number
  per_page?: number
}
