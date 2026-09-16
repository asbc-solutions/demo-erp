export type CcType =
  | "cost_centre"
  | "profit_centre"
  | "investment_centre"
  | "revenue_centre"

export type CostCenterBudget = {
  budget_amount: number
  actual_amount: number
  utilization_pct: number
  overage_warning: boolean
}

export type SalarySummary = {
  headcount: number
  avg_salary: number
  total_cost: number
}

export type CostCenter = {
  id: string
  cc_code: string
  cc_name: string
  cc_name_local: string | null
  cc_type: CcType
  account_code: string
  currency_code: string
  fiscal_year: number
  parent_cc_id: string | null
  branch_id: string
  dept_id: string
  is_active: boolean
  budget: CostCenterBudget
  salary_summary: SalarySummary
}

export type CostCenterListParams = {
  page?: number
  per_page?: number
  search?: string
  fiscal_year: number
  cc_type?: CcType
  branch_id?: string
  dept_id?: string
  is_active?: boolean
}

export type CreateCostCenterPayload = {
  cc_code: string
  cc_name: string
  cc_name_local?: string
  cc_type: CcType
  branch_id: string
  dept_id: string
  account_code: string
  currency_code: string
  budget_amount: number
  fiscal_year: number
  is_active?: boolean
}

export type UpdateCostCenterPayload = Omit<
  CreateCostCenterPayload,
  "cc_code" | "fiscal_year"
>
