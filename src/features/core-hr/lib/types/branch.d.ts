export type BranchType =
  | "head_office"
  | "regional_office"
  | "branch"
  | "warehouse"
  | "site"

export type BranchContacts = {
  phone: string | null
  email: string | null
  address: {
    line1: string
    line2: string | null
    city: string
    country_code: string
    postal_code: string | null
  }
}

export type BranchHeadcount = {
  budget: number
  filled: number
  vacant: number
}

/** Shape of GET /branches/:id/headcount — flat, prefixed field names (distinct from `BranchHeadcount`, the nested shape embedded in `Branch.headcount_summary`). */
export type BranchHeadcountSummary = {
  headcount_budget: number
  headcount_filled: number
  headcount_vacant: number
}

export type Branch = {
  id: string
  branch_code: string
  branch_name: string
  branch_name_local: string | null
  branch_type: BranchType
  parent_branch_id: string | null
  is_head_office: boolean
  is_active: boolean
  established_date: string | null
  profile: {
    branch_type: BranchType
    established_date: string | null
    manager_emp_id: string | null
    tax_id: string | null
  }
  contacts: BranchContacts
  departments: unknown[]
  headcount_summary: BranchHeadcount
  created_at: string
  updated_at: string
}

export type BranchListItem = {
  id: string
  branch_code: string
  branch_name: string
  branch_name_local: string | null
  branch_type: BranchType
  is_head_office: boolean
  is_active: boolean
  employee_count: number
}

export type BranchListParams = {
  page?: number
  per_page?: number
  search?: string
  branch_type?: BranchType
  country_code?: string
  is_active?: boolean
}

export type CreateBranchPayload = {
  branch_code: string
  branch_name: string
  branch_name_local?: string
  branch_type: BranchType
  parent_branch_id?: string | null
  country_code: string
  city: string
  address_line1: string
  address_line2?: string | null
  postal_code?: string | null
  phone?: string | null
  email?: string | null
  tax_id?: string | null
  manager_emp_id?: string | null
  is_head_office?: boolean
  is_active?: boolean
  established_date?: string | null
}

export type UpdateBranchPayload = CreateBranchPayload
