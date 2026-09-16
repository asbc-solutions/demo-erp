"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  appraisalsApi,
  calibrationApi,
  feedbackApi,
  goalsApi,
  kpisApi,
  pipApi,
  reviewCyclesApi,
} from "../api/performance"
import { coreHrKeys } from "../constants/query-keys"
import type {
  AssignKpiPayload,
  CreateCalibrationSessionPayload,
  CreateGoalPayload,
  CreateImprovementPlanPayload,
  CreateKpiPayload,
  CreateReviewCyclePayload,
  EnrolParticipantPayload,
  GoalCheckInPayload,
  InitAppraisalPayload,
  Request360FeedbackPayload,
  SubmitFeedbackResponsePayload,
  SubmitManagerReviewPayload,
  SubmitSelfAssessmentPayload,
  TransitionPipPayload,
} from "../types"

// ─── KPI Library ──────────────────────────────────────────────────────────────

export function useCreateKpi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateKpiPayload) =>
      kpisApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceKpis.all }),
  })
}

export function useAssignKpi() {
  return useMutation({
    mutationFn: (payload: AssignKpiPayload) =>
      kpisApi.assign(payload).then((r) => r.data.data),
  })
}

// ─── Review Cycles ────────────────────────────────────────────────────────────

export function useCreateReviewCycle() {
  return useMutation({
    mutationFn: (payload: CreateReviewCyclePayload) =>
      reviewCyclesApi.create(payload).then((r) => r.data.data),
  })
}

export function useEnrolParticipant() {
  return useMutation({
    mutationFn: ({
      cycleId,
      payload,
    }: {
      cycleId: string
      payload: EnrolParticipantPayload
    }) => reviewCyclesApi.enrolParticipant(cycleId, payload).then((r) => r.data.data),
  })
}

// ─── Appraisals ───────────────────────────────────────────────────────────────

export function useInitAppraisal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: InitAppraisalPayload) =>
      appraisalsApi.init(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceAppraisals.all }),
  })
}

export function useSubmitSelfAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      appraisalId,
      payload,
    }: {
      appraisalId: string
      payload: SubmitSelfAssessmentPayload
    }) =>
      appraisalsApi
        .submitSelfAssessment(appraisalId, payload)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceAppraisals.all }),
  })
}

export function useSubmitManagerReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      appraisalId,
      payload,
    }: {
      appraisalId: string
      payload: SubmitManagerReviewPayload
    }) =>
      appraisalsApi
        .submitManagerReview(appraisalId, payload)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceAppraisals.all }),
  })
}

export function useAcknowledgeAppraisal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appraisalId: string) =>
      appraisalsApi.acknowledge(appraisalId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceAppraisals.all }),
  })
}

// ─── Goals & OKRs ─────────────────────────────────────────────────────────────

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) =>
      goalsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceGoals.all }),
  })
}

export function useSubmitGoalForApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) =>
      goalsApi.submit(goalId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceGoals.all }),
  })
}

export function useGoalCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      goalId,
      payload,
    }: {
      goalId: string
      payload: GoalCheckInPayload
    }) => goalsApi.checkIn(goalId, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceGoals.all }),
  })
}

// ─── 360 Feedback ─────────────────────────────────────────────────────────────

export function useRequest360Feedback() {
  return useMutation({
    mutationFn: (payload: Request360FeedbackPayload) =>
      feedbackApi.request(payload).then((r) => r.data.data),
  })
}

export function useSubmitFeedbackResponse() {
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string
      payload: SubmitFeedbackResponsePayload
    }) => feedbackApi.respond(requestId, payload).then((r) => r.data.data),
  })
}

// ─── Calibration ──────────────────────────────────────────────────────────────

export function useCreateCalibrationSession() {
  return useMutation({
    mutationFn: (payload: CreateCalibrationSessionPayload) =>
      calibrationApi.create(payload).then((r) => r.data.data),
  })
}

export function useFinaliseCalibration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      calibrationApi.finalise(sessionId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.performanceAppraisals.all }),
  })
}

// ─── Performance Improvement Plans (PIP) ──────────────────────────────────────

export function useCreateImprovementPlan() {
  return useMutation({
    mutationFn: (payload: CreateImprovementPlanPayload) =>
      pipApi.create(payload).then((r) => r.data.data),
  })
}

export function useTransitionPip() {
  return useMutation({
    mutationFn: ({
      pipId,
      payload,
    }: {
      pipId: string
      payload: TransitionPipPayload
    }) => pipApi.transition(pipId, payload).then((r) => r.data.data),
  })
}
