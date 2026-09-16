export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted"
export type QuotationTab = "all" | QuotationStatus

export type QuotationListItem = {
  id: string
  number: string
  customer_name: string
  salesperson_name: string
  quotation_date: string
  validity_date: string
  /** Countdown to expiry; null before the quotation is sent. */
  days_left: number | null
  status: QuotationStatus
  status_label: string
  grand_total: number
}

export type QuotationListParams = {
  tab?: QuotationTab
  customer_id?: string
  salesperson_id?: string
  q?: string
  page?: number
  per_page?: number
}

export type QuotationLine = {
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
 * GET /sales/quotations/:id — Bruno docs give no example JSON, only prose:
 * "lines, totals, days_left, actions_available" (see docs/sales.md §4.3).
 * Modeled conservatively; confirm against a live call before relying on
 * exact totals field names beyond `grand_total`.
 */
export type Quotation = {
  id: string
  number: string
  customer_id: string
  customer_name: string
  salesperson_id: string
  salesperson_name: string
  quotation_date: string
  validity_date: string
  validity_days: number
  days_left: number | null
  status: QuotationStatus
  status_label: string
  terms_and_conditions: string | null
  lines: QuotationLine[]
  subtotal: number
  discount_total: number
  tax_total: number
  grand_total: number
  converted_order_id: string | null
  /** Set once a discount approval has been requested; null while none exists. */
  discount_approval_id: string | null
  discount_approved: boolean
  discount_approved_by: string | null
  discount_approved_at: string | null
  /**
   * What the backend will actually permit right now — verified vocabulary:
   * draft `["edit","delete","send","duplicate"]`, sent `["accept","reject","duplicate"]`,
   * accepted `["convert","duplicate"]`. Drive action buttons off this, not off `status`.
   */
  actions_available: string[]
}

export type CreateQuotationPayload = {
  customer_id: string
  salesperson_id: string
  quotation_date?: string
  validity_days?: number
  terms_and_conditions?: string
}

export type UpdateQuotationPayload = Partial<
  Omit<CreateQuotationPayload, "customer_id" | "salesperson_id"> & {
    customer_id: string
    salesperson_id: string
  }
>

export type QuotationLineInput = {
  product_id?: string
  /** Required if no product_id. */
  description?: string
  quantity: number
  /** Required if no product_id. */
  unit_price?: number
  discount_percent?: number
  tax_percent?: number
}

export type SendQuotationPayload = {
  sent_via: "email" | "whatsapp" | "manual"
}

export type AcceptQuotationPayload = {
  acceptance_reference?: string
}

export type RejectQuotationPayload = {
  rejection_reason_id: string
  rejection_note?: string
}

export type QuotationExportFilters = {
  tab?: QuotationTab
  customer_id?: string
  salesperson_id?: string
  q?: string
}

export type QuotationPdfParams = {
  lang?: "ar" | "en"
  paper?: "a4" | "letter"
}
