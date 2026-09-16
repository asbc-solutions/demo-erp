export type PositionStatus =
  | "open"
  | "filled"
  | "frozen"
  | "closed"
  | "on_hold"

export type VacancyStatus = "open" | "partial" | "filled"

/** Flat shape returned by GET /positions (list) */
export type PositionListItem = {
  id: string
  position_title: string
  position_code: string
  dept_id: string | null
  branch_id: string | null
  job_id: string | null
  headcount_budget: number
  headcount_filled: number
  headcount_vacant: number
  vacancy_status: VacancyStatus
  position_status: PositionStatus
  is_budgeted: boolean
  is_active: boolean
}

export type PositionListParams = {
  page?: number
  per_page?: number
  search?: string
  dept_id?: string
  branch_id?: string
  job_id?: string
  position_status?: PositionStatus
  is_budgeted?: boolean
  vacancy_only?: boolean
  is_active?: boolean
}

export type CreatePositionPayload = {
  position_title: string
  position_title_local?: string
  position_code?: string
  dept_id?: string | null
  branch_id?: string | null
  job_id?: string | null
  cost_centre_id?: string | null
  headcount_budget: number
  is_budgeted?: boolean
  effective_date?: string | null
  expiry_date?: string | null
  is_active?: boolean
}

export type UpdatePositionPayload = Partial<CreatePositionPayload>
