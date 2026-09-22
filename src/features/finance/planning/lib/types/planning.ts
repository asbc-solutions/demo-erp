export type BudgetStatus = "draft" | "approved" | "locked"

export type BudgetLine = {
  id: string
  cost_center_id: string
  name: string
  annual: number
  /** Year-to-date share of the annual figure. */
  budgeted: number
  actual: number
  variance: number
  used: number | null
}

export type Budget = {
  id: string
  code: string
  name: string
  year: number
  status: BudgetStatus
  scope: string
  scope_label: string
  months_elapsed: number
  total: number
  budgeted: number
  actual: number
  variance: number
  approved_by: string | null
  approved_on: string | null
  locked_by: string | null
  locked_on: string | null
  lines: BudgetLine[]
}

export type BudgetList = { items: Budget[]; active: number }

export type NewBudgetInput = { name: string; year: number; scope: string; annual: number }

export type CostCenterType = "department" | "branch" | "project"

export type CostCenter = {
  id: string
  code: string
  name: string
  name_ar: string | null
  type: CostCenterType
  parent_id: string | null
  status: string
  depth: number
  revenue: number
  expense: number
  contribution: number
  margin: number | null
}

export type CostCenterList = {
  items: CostCenter[]
  revenue: number
  expense: number
  contribution: number
  margin: number | null
  year: string
}

export type CostCenterDetail = CostCenter & {
  parent: { id: string; code: string; name: string } | null
  children: CostCenter[]
  accounts: { id: string; code: string; name: string; kind: "revenue" | "expense"; amount: number }[]
  budget_id: string | null
  year: string
}

export type NewCostCenterInput = { code: string; name: string; name_ar: string; type: CostCenterType; parent_id: string | null }

export type Dimension = {
  id: string
  code: string
  name: string
  name_ar?: string
  values: string[]
  postings: number
  required: boolean
}

export type DimensionList = { items: Dimension[]; required: number; values: number }

export type NewDimensionInput = { name: string; name_ar: string; values: string; required: boolean }

export type AllocationRule = {
  id: string
  code: string
  name: string
  basis: string
  basis_label: string
  source_accounts: { code: string; name: string }[]
  targets: { cost_center_id: string; name: string; weight: number }[]
  weights_total: number
  active: boolean
  status: "ready" | "posted" | "inactive"
  last_run: { period: string; entry: string; amount: number; date: string } | null
}

export type AllocationRuleList = {
  items: AllocationRule[]
  active: number
  paused: number
  targets: number
  period: string
  pending: number
  bases: { value: string; label: string }[]
}

export type AllocationRuleInput = { name: string; source_accounts: string; basis: string; targets: string; active: boolean }

export type AllocationRun = { period: string; posted: { rule: string; entry: string; amount: number }[]; total: number }
