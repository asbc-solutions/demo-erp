import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  Appraisal,
  AssignKpiPayload,
  CalibrationSession,
  CreateCalibrationSessionPayload,
  CreateGoalPayload,
  CreateImprovementPlanPayload,
  CreateKpiPayload,
  CreateReviewCyclePayload,
  CycleParticipant,
  EnrolParticipantPayload,
  FeedbackRequest,
  FeedbackResponse,
  Goal,
  GoalCheckIn,
  GoalCheckInPayload,
  ImprovementPlan,
  InitAppraisalPayload,
  Kpi,
  KpiAssignment,
  KpiListParams,
  MyAppraisalsParams,
  MyGoalsParams,
  Request360FeedbackPayload,
  ReviewCycleListParams,
  ReviewCycle,
  SubmitFeedbackResponsePayload,
  SubmitManagerReviewPayload,
  SubmitSelfAssessmentPayload,
  TeamAppraisalsParams,
  TransitionPipPayload,
} from "../types"

type Paginated<T> = Omit<ApiResponse<T>, "meta"> & { meta: PaginationMeta }

// ─── KPI Library ──────────────────────────────────────────────────────────────

export const kpisApi = {
  list: (params?: KpiListParams) =>
    httpClient.get<Paginated<Kpi[]>>("/performance/kpis", { params }),

  create: (payload: CreateKpiPayload) =>
    httpClient.post<ApiResponse<Kpi>>("/performance/kpis", payload),

  assign: (payload: AssignKpiPayload) =>
    httpClient.post<ApiResponse<KpiAssignment>>(
      "/performance/kpi-assignments",
      payload,
    ),
}

// ─── Review Cycles ────────────────────────────────────────────────────────────

export const reviewCyclesApi = {
  list: (params?: ReviewCycleListParams) =>
    httpClient.get<Paginated<ReviewCycle[]>>("/performance/cycles", {
      params,
    }),

  create: (payload: CreateReviewCyclePayload) =>
    httpClient.post<ApiResponse<ReviewCycle>>("/performance/cycles", payload),

  enrolParticipant: (cycleId: string, payload: EnrolParticipantPayload) =>
    httpClient.post<ApiResponse<CycleParticipant>>(
      `/performance/cycles/${cycleId}/participants`,
      payload,
    ),
}

// ─── Appraisals ───────────────────────────────────────────────────────────────

export const appraisalsApi = {
  mine: (params?: MyAppraisalsParams) =>
    httpClient.get<Paginated<Appraisal[]>>("/performance/appraisals/me", {
      params,
    }),

  byCycle: (cycleId: string, params?: TeamAppraisalsParams) =>
    httpClient.get<Paginated<Appraisal[]>>(
      `/performance/cycles/${cycleId}/appraisals`,
      { params },
    ),

  init: (payload: InitAppraisalPayload) =>
    httpClient.post<ApiResponse<Appraisal>>("/performance/appraisals", payload),

  submitSelfAssessment: (
    appraisalId: string,
    payload: SubmitSelfAssessmentPayload,
  ) =>
    httpClient.post<ApiResponse<Appraisal>>(
      `/performance/appraisals/${appraisalId}/self-assessment`,
      payload,
    ),

  submitManagerReview: (
    appraisalId: string,
    payload: SubmitManagerReviewPayload,
  ) =>
    httpClient.post<ApiResponse<Appraisal>>(
      `/performance/appraisals/${appraisalId}/manager-review`,
      payload,
    ),

  acknowledge: (appraisalId: string) =>
    httpClient.post<ApiResponse<Appraisal>>(
      `/performance/appraisals/${appraisalId}/acknowledge`,
      {},
    ),
}

// ─── Goals & OKRs ─────────────────────────────────────────────────────────────

export const goalsApi = {
  mine: (params?: MyGoalsParams) =>
    httpClient.get<Paginated<Goal[]>>("/performance/goals", { params }),

  create: (payload: CreateGoalPayload) =>
    httpClient.post<ApiResponse<Goal>>("/performance/goals", payload),

  submit: (goalId: string) =>
    httpClient.post<ApiResponse<Goal>>(
      `/performance/goals/${goalId}/submit`,
      {},
    ),

  checkIn: (goalId: string, payload: GoalCheckInPayload) =>
    httpClient.post<ApiResponse<GoalCheckIn>>(
      `/performance/goals/${goalId}/checkin`,
      payload,
    ),
}

// ─── 360 Feedback ─────────────────────────────────────────────────────────────

export const feedbackApi = {
  pending: () =>
    httpClient.get<Paginated<FeedbackRequest[]>>(
      "/performance/feedback/pending",
    ),

  request: (payload: Request360FeedbackPayload) =>
    httpClient.post<ApiResponse<FeedbackRequest>>(
      "/performance/feedback/requests",
      payload,
    ),

  respond: (requestId: string, payload: SubmitFeedbackResponsePayload) =>
    httpClient.post<ApiResponse<FeedbackResponse>>(
      `/performance/feedback/requests/${requestId}/respond`,
      payload,
    ),
}

// ─── Calibration ──────────────────────────────────────────────────────────────

export const calibrationApi = {
  create: (payload: CreateCalibrationSessionPayload) =>
    httpClient.post<ApiResponse<CalibrationSession>>(
      "/performance/calibrations",
      payload,
    ),

  finalise: (sessionId: string) =>
    httpClient.post<ApiResponse<CalibrationSession>>(
      `/performance/calibrations/${sessionId}/finalise`,
      {},
    ),
}

// ─── Performance Improvement Plans (PIP) ──────────────────────────────────────

export const pipApi = {
  create: (payload: CreateImprovementPlanPayload) =>
    httpClient.post<ApiResponse<ImprovementPlan>>("/performance/pips", payload),

  transition: (pipId: string, payload: TransitionPipPayload) =>
    httpClient.post<ApiResponse<ImprovementPlan>>(
      `/performance/pips/${pipId}/transition`,
      payload,
    ),
}
