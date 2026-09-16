/* ------------------------------------------------------------------ */
/* Project governance — stage gates, change requests, closure          */
/* (ProjectGovernance module: project-wide G0–G6 pipeline)             */
/* ------------------------------------------------------------------ */

export type GateDecisionStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"

export type GateApprovalStep = {
  step_number: number
  approver_role: string
  employee_id: string | null
  employee_name: string | null
  status: string
  status_label: string
  decision_date: string | null
  decision_notes: string | null
}

/** Row from `GET /pm/projects/{id}/gates` — one of the fixed G0–G6 gates. */
export type Gate = {
  id: string
  project_id: string
  code: string
  name: string
  sequence: number
  due_date: string | null
  completed_date: string | null
  decision_status: GateDecisionStatus
  decision_status_label: string
  /** `null` until the gate is submitted for review. */
  approval_chain: GateApprovalStep[] | null
}

/** Row from portfolio `GET /pm/gates`. */
export type PortfolioGate = {
  gate_id: string
  project_id: string
  project_name: string
  code: string
  name: string
  sequence: number
  due_date: string | null
  completed_date: string | null
  decision_status: GateDecisionStatus
}

/* ------------------------------------------------------------------ */
/* Change requests                                                      */
/* ------------------------------------------------------------------ */

export type ChangeRequestType =
  | "scope"
  | "cost"
  | "schedule"
  | "technical"
  | "other"

export type ChangeRequestStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "on_track"
  | "blocked"
  | "completed"

/** Row from `GET /pm/projects/{id}/change-requests`. */
export type ChangeRequest = {
  id: string
  project_id: string
  cr_number: string
  title: string
  description: string | null
  type: ChangeRequestType
  type_label: string
  cost_impact: number
  schedule_impact_days: number
  raised_by: string
  raised_date: string
  status: ChangeRequestStatus
  status_label: string
}

/** Row from portfolio `GET /pm/change-requests`. */
export type PortfolioChangeRequest = {
  cr_id: string
  project_id: string
  project_name: string
  cr_number: string
  title: string
  type: ChangeRequestType
  cost_impact: number
  schedule_impact_days: number
  status: ChangeRequestStatus
  raised_date: string
}

export type CreateChangeRequestPayload = {
  title: string
  description?: string
  type: ChangeRequestType
  cost_impact?: number
  schedule_impact_days?: number
}

/** Execution status transition for an approved CR. */
export type ChangeRequestExecutionStatus = "on_track" | "blocked" | "completed"

/* ------------------------------------------------------------------ */
/* Closure checklist                                                    */
/* ------------------------------------------------------------------ */

export type ClosureItem = {
  id: string
  category: string
  category_label: string
  label: string
  assignee_label: string | null
  sequence: number
  is_complete: boolean
  completed_at: string | null
}

/** `GET /pm/projects/{id}/closure` — fixed 15-item checklist. */
export type ClosureChecklist = {
  summary: { total: number; complete: number }
  items: ClosureItem[]
}

/** Row from portfolio `GET /pm/closure/summary`. */
export type ClosureSummaryRow = {
  project_id: string
  project_name: string
  total: number
  complete: number
  is_ready_to_lock: boolean
}
