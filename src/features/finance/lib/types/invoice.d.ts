import type { PaginationMeta } from "@/src/shared/lib/types/api"

/**
 * `status` is the *displayed* state (includes the derived `overdue`, which is
 * never stored). `persisted_status` is the actual DB column value.
 * See bruno/Finance/Invoices/List Invoices.bru docs.
 */
export type FinanceInvoiceStatus = "draft" | "sent" | "paid" | "cancelled" | "overdue"
export type FinancePersistedInvoiceStatus = "draft" | "sent" | "paid" | "cancelled"
export type FinanceInvoiceStatusFilter = "All" | "Draft" | "Sent" | "Overdue" | "Paid"

export type FinanceInvoiceListItem = {
  id: string
  invoice_number: string
  client_name: string
  client_email: string | null
  issue_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  currency_code: string
  status: FinanceInvoiceStatus
  persisted_status: FinancePersistedInvoiceStatus
}

/** GET /finance/invoices — `meta.summary` rides along with pagination in one call. */
export type FinanceInvoiceListMeta = PaginationMeta & {
  summary: {
    total_revenue: number
    pending_amount: number
    overdue_amount: number
    draft_count: number
  }
}

export type FinanceInvoiceListParams = {
  status?: string
  search?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export type FinanceInvoiceLineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  sort_order: number
}

/** GET /finance/invoices/:id — full detail incl. ordered line_items. */
export type FinanceInvoiceDetail = FinanceInvoiceListItem & {
  tax_rate: number
  notes: string | null
  subtotal_amount: number
  tax_amount: number
  status_label: string
  sent_at: string | null
  paid_at: string | null
  line_items: FinanceInvoiceLineItem[]
  created_at: string
  updated_at: string
}

export type FinanceInvoiceLineItemPayload = {
  description: string
  quantity: number
  unit_price: number
}

/**
 * Shared by Save Draft and Send Invoice — the only difference is `status`.
 * Totals are computed server-side from `line_items`, never sent by the client.
 */
export type SaveFinanceInvoicePayload = {
  client_name: string
  client_email?: string
  issue_date: string
  due_date: string
  tax_rate?: number
  notes?: string
  status: "draft" | "sent"
  line_items: FinanceInvoiceLineItemPayload[]
}

export type CreateFinanceInvoiceResult = {
  id: string
  invoice_number: string
  client_name: string
  issue_date: string
  due_date: string
  tax_rate: number
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  currency_code: string
  status: FinanceInvoiceStatus
  persisted_status: FinancePersistedInvoiceStatus
  line_items: FinanceInvoiceLineItem[]
}

export type UpdateFinanceInvoiceResult = {
  id: string
  invoice_number: string
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  status: FinanceInvoiceStatus
  persisted_status: FinancePersistedInvoiceStatus
}

export type SendFinanceInvoiceResult = {
  id: string
  invoice_number: string
  status: "sent"
  persisted_status: "sent"
  sent_at: string
  outstanding_amount: number
}

/** POST /finance/invoices/:id/mark-paid — omit `amount` to settle in full. */
export type MarkFinanceInvoicePaidPayload = {
  amount?: number
  paid_at?: string
}

export type MarkFinanceInvoicePaidResult = {
  id: string
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  status: FinanceInvoiceStatus
  persisted_status: FinancePersistedInvoiceStatus
  paid_at: string | null
}

export type CancelFinanceInvoiceResult = {
  id: string
  invoice_number: string
  status: "cancelled"
  persisted_status: "cancelled"
}
