"use client"

import { useQuery } from "@tanstack/react-query"

import {
  certificationsApi,
  coursesApi,
  programsApi,
  sessionsApi,
  skillsApi,
} from "../api/training"
import { coreHrKeys } from "../constants/query-keys"
import type {
  CertificationListParams,
  CourseListParams,
  ProgramListParams,
  SessionListParams,
  SkillListParams,
} from "../types"

// ─── Programs ─────────────────────────────────────────────────────────────────

export function usePrograms(params?: ProgramListParams) {
  return useQuery({
    queryKey: coreHrKeys.trainingPrograms.list(params),
    queryFn: () => programsApi.list(params).then((r) => r.data),
  })
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: coreHrKeys.trainingPrograms.detail(id),
    queryFn: () => programsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useCourses(params?: CourseListParams) {
  return useQuery({
    queryKey: coreHrKeys.trainingCourses.list(params),
    queryFn: () => coursesApi.list(params).then((r) => r.data),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: coreHrKeys.trainingCourses.detail(id),
    queryFn: () => coursesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useSessions(params?: SessionListParams) {
  return useQuery({
    queryKey: coreHrKeys.trainingSessions.list(params),
    queryFn: () => sessionsApi.list(params).then((r) => r.data),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: coreHrKeys.trainingSessions.detail(id),
    queryFn: () => sessionsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useSessionFeedbackSummary(id: string) {
  return useQuery({
    queryKey: coreHrKeys.trainingSessions.feedbackSummary(id),
    queryFn: () => sessionsApi.feedbackSummary(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

// ─── Certifications ───────────────────────────────────────────────────────────

export function useCertifications(params?: CertificationListParams) {
  return useQuery({
    queryKey: coreHrKeys.trainingCertifications.list(params),
    queryFn: () => certificationsApi.list(params).then((r) => r.data),
  })
}

export function useMyCertifications() {
  return useQuery({
    queryKey: coreHrKeys.trainingCertifications.mine(),
    queryFn: () => certificationsApi.mine().then((r) => r.data.data),
  })
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export function useSkills(params?: SkillListParams) {
  return useQuery({
    queryKey: coreHrKeys.trainingSkills.list(params),
    queryFn: () => skillsApi.list(params).then((r) => r.data),
  })
}

export function useSkillGapAnalysis(employeeId: string, jobGradeId: string) {
  return useQuery({
    queryKey: coreHrKeys.trainingSkills.gapAnalysis(employeeId, jobGradeId),
    queryFn: () =>
      skillsApi.gapAnalysis(employeeId, jobGradeId).then((r) => r.data.data),
    enabled: !!employeeId && !!jobGradeId,
  })
}
