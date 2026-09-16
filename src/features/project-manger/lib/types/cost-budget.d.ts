/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export type BudgetStatus = "draft" | "released" | "frozen"

export type CostType = "labor" | "material" | "equipment" | "overhead" | "other"

export type CommitmentSource = "po" | "reservation" | "expense" | "allocation"

export type ActualCostSource =
  | "timesheet"
  | "goods_receipt"
  | "expense"
  | "allocation"

/* ------------------------------------------------------------------ */
/* DTOs                                                                */
/* ------------------------------------------------------------------ */

export type Budget = {
  budget_id: string
  project_id: string
  cost_centre_id: string | null
  budget_amount: number
  released_amount: number
  status: BudgetStatus
  status_label: string
  fiscal_year: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CostPlan = {
  plan_id: string
  project_id: string
  node_id: string
  node_type: string
  node_type_label?: string
  cost_type: CostType
  cost_type_label: string
  description: string | null
  planned_amount: number
  currency_code: string
}

export type Commitment = {
  commitment_id: string
  project_id: string
  node_id: string
  node_type: string
  source: CommitmentSource
  source_label: string
  reference_number: string | null
  description: string | null
  amount: number
  currency_code: string
  committed_date: string
}

export type ActualCost = {
  actual_cost_id: string
  source: ActualCostSource
  source_label: string
  amount: number
  cost_date: string
  employee_id?: string | null
}

export type NodeCost = {
  node_id: string
  planned: number
  committed: number
  actual: number
  variance: number
  variance_label: "under_budget" | "over_budget"
}

export type EvmMetrics = {
  project_id: string
  // These metrics are computed server-side and come back null until there is
  // enough cost/progress data to derive them (e.g. AC = 0 → CPI undefined).
  bac: number | null
  pv: number | null
  ev: number | null
  ac: number | null
  cv: number | null
  sv: number | null
  cpi: number | null
  spi: number | null
  eac: number | null
  etc: number | null
  vac: number | null
  cost_performance_label: string
  schedule_performance_label: string
}

/* ------------------------------------------------------------------ */
/* Portfolio dashboard / charts (omit project_id → portfolio-wide)     */
/* ------------------------------------------------------------------ */

export type BudgetForecast = {
  original_budget: number | null
  eac: number | null
  variance_amount: number | null
  variance_pct: number | null
}

export type AvailabilityControl = {
  project_id: string
  mode: string
  warning_pct: number
  hard_stop_pct: number
  notify_roles: string[]
  is_default: boolean
}

export type BudgetDashboard = {
  project_id: string | null
  currency_code: string
  evm: EvmMetrics
  forecast: BudgetForecast
  /** `null` for portfolio-wide requests. */
  availability_control: AvailabilityControl | null
}

export type CostMixItem = {
  cost_type: CostType
  cost_type_label: string
  amount: number
  pct: number
}

export type CostMixResponse = {
  project_id: string | null
  currency_code: string
  items: CostMixItem[]
}

export type WaterfallItem = {
  code: string
  name: string
  node_type: string
  planned_amount: number
  committed_amount: number
  actual_amount: number
  variance: number
  currency_code: string
}

export type WaterfallResponse = {
  project_id: string | null
  items: WaterfallItem[]
}

/** Omit `project_id` for a portfolio-wide roll-up. */
export type BudgetScopeParams = { project_id?: string }

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

export type CreateBudgetPayload = {
  budget_amount: number
  fiscal_year: number
  cost_centre_id?: string | null
  description?: string | null
}

export type CreateCostPlanPayload = {
  project_id: string
  node_type: string
  cost_type: CostType
  planned_amount: number
  currency_code?: string
  description?: string | null
}

export type CreateCommitmentPayload = {
  project_id: string
  node_type: string
  source: CommitmentSource
  amount: number
  committed_date: string
  reference_number?: string
  description?: string
  currency_code?: string
}

export type PostActualCostPayload = {
  project_id: string
  node_type: string
  source: ActualCostSource
  amount: number
  cost_date: string
  employee_id?: string
  reference_number?: string
  description?: string
  currency_code?: string
}
