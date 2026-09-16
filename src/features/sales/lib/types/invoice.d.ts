export type InvoiceStatus = "draft" | "posted" | "sent" | "closed" | "cancelled"
export type InvoiceTab = "all" | InvoiceStatus
export type InvoicePaymentStatus = "unpaid" | "partial" | "paid"

export type InvoiceListItem = {
  id: string
  /**
   * `null` until the invoice is posted. `POST /sales/invoices/:id/post` is
   * documented as the step that "reserves the final number" `INV-{YYYY}-{####}`,
   * so a `draft` — and anything cancelled while still a draft — has none.
   * Fiscal numbering has to stay gapless, which is why a draft that may yet be
   * deleted never burns a number.
   */
  number: string | null
  order_id: string
  customer_name: string
  status: InvoiceStatus
  status_label: string
  invoice_date: string
  due_date: string
  total_due: number
  amount_paid: number
  payment_status: InvoicePaymentStatus
  payment_status_label: string
}

export type InvoiceListParams = {
  tab?: InvoiceTab
  customer_id?: string
  order_id?: string
  q?: string
  page?: number
  per_page?: number
}

export type InvoiceLine = {
  id: string
  line_no: number
  product_id: string | null
  description: string
  quantity: number
  unit_price: number
  tax_percent: number
  line_total: number
}

/**
 * GET /sales/invoices/:id — shape verified against the live API. Invoices have no
 * line-edit endpoint — lines here are an immutable snapshot copied from the source
 * order at generation time. Unlike quotations and orders, the invoice resource
 * carries NO discount figures (no `discount_total`, no line `discount_percent`).
 */
export type Invoice = {
  id: string
  /**
   * `null` until the invoice is posted. `POST /sales/invoices/:id/post` is
   * documented as the step that "reserves the final number" `INV-{YYYY}-{####}`,
   * so a `draft` — and anything cancelled while still a draft — has none.
   * Fiscal numbering has to stay gapless, which is why a draft that may yet be
   * deleted never burns a number.
   */
  number: string | null
  order_id: string
  customer_id: string
  customer_name: string
  status: InvoiceStatus
  status_label: string
  invoice_date: string
  due_date: string
  lines: InvoiceLine[]
  subtotal: number
  tax_total: number
  total_due: number
  amount_paid: number
  remaining_due: number
  payment_status: InvoicePaymentStatus
  payment_status_label: string
  actions_available: string[]
}

export type MarkInvoiceSentPayload = {
  sent_via: "email" | "whatsapp" | "manual"
}

/** Free-text reason — NOT a reason-id like Cancel Order. */
export type CancelInvoicePayload = {
  cancellation_reason: string
}

export type InvoiceExportFilters = {
  tab?: InvoiceTab
  customer_id?: string
  order_id?: string
  q?: string
}

export type InvoicePdfParams = {
  lang?: "ar" | "en"
  paper?: "a4" | "letter"
}

export type InvoicePrintUrlParams = {
  lang?: "ar" | "en"
}
