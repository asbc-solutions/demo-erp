export type OrderStatus =
  | "draft"
  | "pending_confirmation"
  | "confirmed"
  | "invoiced"
  | "closed"
  | "cancelled"
export type OrderTab = "all" | OrderStatus

export type OrderListItem = {
  id: string
  number: string
  customer_name: string
  salesperson_name: string
  status: OrderStatus
  status_label: string
  delivery_date: string | null
  grand_total: number
}

export type OrderListParams = {
  tab?: OrderTab
  customer_id?: string
  salesperson_id?: string
  q?: string
  page?: number
  per_page?: number
}

export type OrderLine = {
  id: string
  product_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
  line_total: number
}

/**
 * A single entry in `sales_order_revisions` — written whenever a confirmed
 * order's lines are edited via PUT .../lines. Exact shape isn't given as an
 * example in the Bruno docs (only described in prose as a per-line diff of
 * quantity/unit_price/discount_percent/tax_percent + document totals, plus
 * the edit reason/note) — confirm against a live call before relying on it.
 */
export type OrderRevision = {
  id: string
  edit_reason_id: string
  edit_reason_label: string | null
  note: string | null
  created_at: string
}

/** GET /sales/orders/:id — prose only ("lines, totals, revisions, actions_available"). */
export type Order = {
  id: string
  number: string
  customer_id: string
  customer_name: string
  salesperson_id: string
  salesperson_name: string
  status: OrderStatus
  status_label: string
  delivery_date: string | null
  lines: OrderLine[]
  subtotal: number
  discount_total: number
  tax_total: number
  grand_total: number
  revisions: OrderRevision[]
  actions_available: string[]
}

export type ConfirmOrderPayload = {
  acknowledge_low_stock?: boolean
}

export type RequestEditOrderPayload = {
  edit_reason_id: string
  note?: string
}

export type OrderLineInput = {
  product_id?: string
  description?: string
  quantity: number
  unit_price?: number
  discount_percent?: number
  tax_percent?: number
}

export type UpdateOrderLinesPayload = {
  edit_reason_id: string
  note?: string
  lines: OrderLineInput[]
}

export type CancelOrderPayload = {
  cancellation_reason_id: string
  cancellation_note?: string
}

export type GenerateInvoicePayload = {
  due_date?: string | null
}

export type OrderExportFilters = {
  tab?: OrderTab
  customer_id?: string
  salesperson_id?: string
  q?: string
}

export type OrderPdfParams = {
  lang?: "ar" | "en"
  paper?: "a4" | "letter"
  include_revision_history?: boolean
}
