// ─── KPI Library ──────────────────────────────────────────────────────────────

export type KpiDirection = "higher_better" | "lower_better" | "exact"
export type KpiMeasurementType =
  | "number"
  | "percentage"
  | "currency"
  | "ratio"
  | "boolean"

export type Kpi = {
  kpi_id: string
  kpi_code: string
  kpi_name: string
  kpi_name_local?: string
  category: string
  unit?: string | null
  direction: KpiDirection
  measurement_type: KpiMeasurementType
  formula?: string | null
  data_source?: string | null
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type KpiListParams = {
  category?: string
  direction?: KpiDirection
  is_active?: boolean
  page?: number
  per_page?: number
}

export type CreateKpiPayload = {
  kpi_code: string
  kpi_name: string
  kpi_name_local?: string
  category: string
  unit?: string
  direction: KpiDirection
  measurement_type: KpiMeasurementType
  formula?: string
  data_source?: string
  description?: string
}

// ─── KPI Assignments ──────────────────────────────────────────────────────────

export type KpiAssigneeType = "employee" | "role" | "dept"

export type KpiAssignment = {
  assignment_id: string
  kpi_id: string
  assignee_type: KpiAssigneeType
  assignee_id: string
  cycle_id?: string | null
  weight_pct: number
  target_value?: number | null
  currency_code?: string | null
  threshold_min?: number | null
  threshold_max?: number | null
  status: string
}

export type AssignKpiPayload = {
  kpi_id: string
  assignee_type: KpiAssigneeType
  assignee_id: string
  cycle_id?: string
  weight_pct: number
  target_value?: number
  currency_code?: string
  threshold_min?: number
  threshold_max?: number
}

// ─── Review Cycles ────────────────────────────────────────────────────────────

export type CycleType =
  | "annual"
  | "semi_annual"
  | "quarterly"
  | "probation"
  | "project"

export type CycleStatus =
  | "draft"
  | "active"
  | "self_review"
  | "manager_review"
  | "calibration"
  | "completed"
  | "closed"
  | "archived"

export type ReviewCyclePhase = {
  name: string
  starts_at?: string
  ends_at?: string
}

export type ReviewCycle = {
  cycle_id: string
  cycle_name: string
  cycle_name_local?: string
  cycle_type: CycleType
  status: CycleStatus
  is_active?: boolean
  period_start: string
  period_end: string
  rating_scale?: number
  phases_json?: ReviewCyclePhase[]
  created_at?: string
  updated_at?: string
}

export type ReviewCycleListParams = {
  status?: CycleStatus
  cycle_type?: CycleType
  is_active?: boolean
  page?: number
  per_page?: number
}

export type CreateReviewCyclePayload = {
  cycle_name: string
  cycle_name_local?: string
  cycle_type: CycleType
  period_start: string
  period_end: string
  phases_json?: ReviewCyclePhase[]
  rating_scale?: number
}

// ─── Cycle Participants ───────────────────────────────────────────────────────

export type CycleParticipant = {
  participant_id: string
  cycle_id: string
  employee_id: string
  reviewer_emp_id?: string | null
  phase_status: string
}

export type EnrolParticipantPayload = {
  employee_id: string
  reviewer_emp_id?: string
}

// ─── Appraisals ───────────────────────────────────────────────────────────────

export type AppraisalStatus =
  | "pending"
  | "self_in_progress"
  | "self_submitted"
  | "manager_in_progress"
  | "manager_submitted"
  | "finalised"
  | "self_done"
  | "manager_done"
  | "calibrated"
  | "acknowledged"

export type AppraisalRatingItemType = "kpi" | "competency" | "goal"

export type AppraisalRating = {
  rating_id: string
  item_type: AppraisalRatingItemType
  item_id: string
  weight_pct: number
  self_rating?: number | null
  self_comment?: string | null
  manager_rating?: number | null
  manager_comment?: string | null
}

export type Appraisal = {
  appraisal_id: string
  cycle_id: string
  employee_id?: string
  reviewer_emp_id?: string | null
  status: AppraisalStatus
  self_score: number | null
  manager_score: number | null
  final_score: number | null
  self_submitted_at?: string | null
  manager_submitted_at?: string | null
  acknowledged_at?: string | null
  /** Embedded cycle, when the API expands the relation. */
  cycle?: ReviewCycle
  /** Embedded subject employee, when the API expands the relation. */
  employee?: { id?: string; full_name?: string } | null
  ratings?: AppraisalRating[]
  created_at?: string
  updated_at?: string
}

export type MyAppraisalsParams = {
  status?: AppraisalStatus
  page?: number
  per_page?: number
}

export type TeamAppraisalsParams = MyAppraisalsParams & {
  reviewer_emp_id?: string
}

export type InitAppraisalPayload = {
  cycle_id: string
  employee_id: string
  reviewer_emp_id?: string
}

export type SelfAssessmentRatingInput = {
  item_type: AppraisalRatingItemType
  item_id: string
  weight_pct: number
  self_rating: number
  self_comment?: string
}

export type SubmitSelfAssessmentPayload = {
  self_score: number
  ratings?: SelfAssessmentRatingInput[]
}

export type ManagerReviewRatingInput = {
  rating_id: string
  manager_rating: number
  manager_comment?: string
}

export type SubmitManagerReviewPayload = {
  manager_score: number
  final_score: number
  ratings?: ManagerReviewRatingInput[]
}

// ─── Goals & OKRs ─────────────────────────────────────────────────────────────

export type GoalType = "smart" | "okr"

export type GoalStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "active"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled"

export type Goal = {
  goal_id: string
  title: string
  title_local?: string
  goal_type: GoalType
  category?: string | null
  status: GoalStatus
  progress_pct: number
  weight_pct?: number | null
  start_date?: string
  due_date?: string
  cycle_id?: string | null
  parent_goal_id?: string | null
  owner_emp_id?: string | null
  owner_name?: string | null
  created_at?: string
  updated_at?: string
}

export type MyGoalsParams = {
  status?: GoalStatus
  cycle_id?: string
  goal_type?: GoalType
  per_page?: number
}

export type CreateGoalPayload = {
  title: string
  title_local?: string
  goal_type: GoalType
  category?: string
  weight_pct?: number
  start_date: string
  due_date: string
  cycle_id?: string
  parent_goal_id?: string
}

export type GoalCheckIn = {
  checkin_id: string
  goal_id: string
  progress_pct: number
  comment?: string | null
  created_at?: string
}

export type GoalCheckInPayload = {
  progress_pct: number
  comment?: string
}

// ─── 360 Feedback ─────────────────────────────────────────────────────────────

export type FeedbackRelationship =
  | "peer"
  | "subordinate"
  | "manager"
  | "self"
  | "external"

export type FeedbackRequestStatus = "pending" | "responded" | "declined"

export type FeedbackRequest = {
  request_id: string
  cycle_id?: string | null
  subject_emp_id?: string
  rater_emp_id: string
  relationship: FeedbackRelationship
  status: FeedbackRequestStatus
  sent_at?: string
  responded_at?: string | null
  created_at?: string
}

export type Request360FeedbackPayload = {
  cycle_id: string
  rater_emp_id: string
  relationship: FeedbackRelationship
}

export type FeedbackResponse = {
  response_id: string
  request_id: string
  strengths?: string | null
  improvements?: string | null
  is_anonymous?: boolean
}

export type SubmitFeedbackResponsePayload = {
  ratings_json?: Record<string, unknown>[]
  strengths?: string
  improvements?: string
  is_anonymous?: boolean
}

// ─── Calibration ──────────────────────────────────────────────────────────────

export type CalibrationScope = "department" | "branch" | "company"
export type CalibrationStatus = "draft" | "in_progress" | "finalised"

export type CalibrationSession = {
  session_id: string
  cycle_id: string
  scope: string
  scope_id?: string | null
  facilitator_emp_id?: string | null
  status: CalibrationStatus
  finalised_at?: string | null
}

export type CreateCalibrationSessionPayload = {
  cycle_id: string
  scope: string
  scope_id?: string
  facilitator_emp_id?: string
}

// ─── Performance Improvement Plans (PIP) ──────────────────────────────────────

export type PipStatus =
  | "draft"
  | "active"
  | "extended"
  | "completed"
  | "failed"
  | "cancelled"

export type PipObjective = {
  title: string
  metric?: string
  due?: string
}

export type ImprovementPlan = {
  pip_id: string
  employee_id: string
  cycle_id?: string | null
  reason?: string
  start_date: string
  end_date: string
  manager_emp_id?: string | null
  hr_emp_id?: string | null
  status: PipStatus
  outcome?: string | null
  objectives_json?: PipObjective[]
}

export type CreateImprovementPlanPayload = {
  employee_id: string
  cycle_id?: string
  reason: string
  start_date: string
  end_date: string
  manager_emp_id?: string
  hr_emp_id?: string
  objectives_json?: PipObjective[]
}

export type TransitionPipPayload = {
  status: PipStatus
  outcome?: string | null
}
