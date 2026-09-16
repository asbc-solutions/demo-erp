/* ------------------------------------------------------------------ */
/* Billing & revenue (per-project)                                     */
/* ------------------------------------------------------------------ */

export type BillingPlan = {
  plan_id: string
  project_id: string
  method: string
  method_label: string
  billing_currency: string
  payment_terms_days: number
  retention_pct: number
  down_payment_amount: number
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RevenueSummary = {
  project_id: string
  contract_value: number
  percent_complete: number
  recognized_revenue: number
  deferred_revenue: number
  total_invoiced: number
  revenue_gap: number
  cumulative_recognized: number
  revenue_gap_label: string
}

export type BillingMilestone = {
  billing_milestone_id: string
  project_id: string
  schedule_milestone_id: string | null
  code: string
  name: string
  due_date: string
  amount: number
  pct_of_total: number
  currency_code: string
  status: string
  status_label: string
}

/* ------------------------------------------------------------------ */
/* Portfolio (all projects at once)                                    */
/* ------------------------------------------------------------------ */

/** `GET /pm/billing/revenue-summary` — aggregate across projects. */
export type PortfolioRevenueSummary = {
  total_contract_value: number
  total_invoiced: number
  total_recognized: number
  unbilled: number
  currency_code: string
  by_project: {
    project_id: string
    project_name: string
    contract_value: number
    invoiced: number
    recognized: number
  }[]
}

/** Row from portfolio `GET /pm/billing/milestones` (no project filter). */
export type PortfolioBillingMilestone = {
  billing_milestone_id: string
  project_id: string
  project_name: string
  code: string
  title: string
  due_date: string
  amount: number
  currency_code: string
  status: string
}

/** Row from portfolio `GET /pm/invoices`. */
export type PortfolioInvoice = {
  invoice_id: string
  project_id: string
  project_name: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  currency_code: string
  status: string
}

export type Invoice = {
  invoice_id: string
  project_id: string
  billing_request_id: string | null
  invoice_number: string
  issue_date: string
  due_date: string
  subtotal: number
  retention_amount: number
  tax_amount: number
  total_amount: number
  currency_code: string
  status: string
  status_label: string
  notes: string | null
  is_active: boolean
  created_at: string
}
