/**
 * Only 2 of the documented 8 `kpis[].key` values are given as examples
 * (`total_sales`, `quotation_conversion_rate`) — the other 6 aren't
 * enumerated in the Bruno docs (see docs/sales.md §4.1). Render unmapped
 * keys generically rather than assuming a fixed 8-item set.
 */
export type DashboardKpi = {
  key: string
  value: number
  delta_pct: number | null
}

export type PipelineStageStatus = "draft" | "sent" | "accepted" | "converted"

export type PipelineStage = {
  status: PipelineStageStatus
  count: number
  /** Conversion rate to the next stage; null for the first stage. */
  advance_pct: number | null
}

/** Only `payment_recorded` is confirmed as a literal `type` value — see notification.d.ts. */
export type RecentActivity = {
  type: string
  ref_id: string
  ref_number: string
  occurred_at: string
}

export type TopCustomer = {
  customer_id: string
  customer_name: string
  total_amount: number
}

export type TopProduct = {
  product_id: string
  product_name: string
  total_amount: number
}

export type SalesDashboard = {
  kpis: DashboardKpi[]
  pipeline_funnel: {
    stages: PipelineStage[]
  }
  recent_activity: RecentActivity[]
  top_customers: TopCustomer[]
  top_products: TopProduct[]
}
