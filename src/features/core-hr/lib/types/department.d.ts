export type DeptType =
  | "operational"
  | "administrative"
  | "support"
  | "technical"
  | "management"

export type DeptHeadcount = {
  budget: number
  filled: number
  vacant: number
}

/** Simplified position item returned by GET /departments/:id/positions */
export type DeptPositionSummary = {
  id: string
  position_title: string
  vacancy_count: number
}

export type Department = {
  id: string
  dept_code: string
  dept_name: string
  dept_name_local: string | null
  dept_type: DeptType
  branch_id: string
  parent_dept_id: string | null
  is_active: boolean
  effective_date: string
  profile: {
    dept_type: DeptType
    effective_date: string
    manager_emp_id: string | null
    cost_centre_id: string | null
  }
  headcount?: DeptHeadcount
  /**
   * Flat headcount fields returned by GET /departments (list) — the detail
   * endpoint (GET /departments/:id) nests the same data under `headcount`
   * instead, so callers should check both shapes.
   */
  headcount_budget?: number
  headcount_filled?: number
  headcount_vacant?: number
  positions?: DeptPositionSummary[]
  created_at: string
  updated_at: string
}

export type DeptListParams = {
  page?: number
  per_page?: number
  search?: string
  branch_id?: string
  dept_type?: DeptType
  is_active?: boolean
}

export type CreateDeptPayload = {
  branch_id: string
  dept_code: string
  dept_name: string
  dept_name_local?: string
  dept_type: DeptType
  parent_dept_id?: string | null
  headcount_budget: number
  effective_date: string
  is_active?: boolean
}

export type UpdateDeptPayload = CreateDeptPayload
