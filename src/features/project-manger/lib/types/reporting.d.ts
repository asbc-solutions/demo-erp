/* ------------------------------------------------------------------ */
/* Portfolio dashboard (GET /pm/portfolio/dashboard)                   */
/* ------------------------------------------------------------------ */

export type PortfolioKpis = {
  total_projects: number
  active_projects: number
  completed_projects: number
  external_projects: number
  on_time_delivery_pct: number
  budget_compliance_pct: number
  resource_utilization_pct: number
  scope_stability_pct: number
}

export type PortfolioStatusRow = {
  status: string
  status_label: string
  project_count: number
  share_pct: number
}

export type PortfolioTypeBreakdown = {
  project_type: string
  project_type_label: string
  project_count: number
  share_pct: number
  total_budget: number
}

export type PortfolioTrendPoint = {
  period: string
  created_count: number
  completed_count: number
  active_count: number
}

export type PortfolioFinancials = {
  total_budget: number
  total_actual_cost: number
  total_invoiced: number
}

export type PortfolioProjectRow = {
  project_id: string
  name: string
  status: string
  budget_amount: number
  actual_cost: number
  total_invoiced: number
}

export type PortfolioDashboard = {
  total_projects: number
  kpis: PortfolioKpis
  by_status: PortfolioStatusRow[]
  by_type: PortfolioTypeBreakdown[]
  trends: PortfolioTrendPoint[]
  financials: PortfolioFinancials
  projects: PortfolioProjectRow[]
}
