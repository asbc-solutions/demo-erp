"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  certificationsApi,
  coursesApi,
  programsApi,
  sessionsApi,
  skillsApi,
} from "../api/training"
import { coreHrKeys } from "../constants/query-keys"
import type {
  AddCourseModulePayload,
  AddCoursePrerequisitePayload,
  AddCourseToProgramPayload,
  AddRoleSkillRequirementPayload,
  AssessEmployeeSkillPayload,
  CreateCoursePayload,
  CreateProgramCohortPayload,
  CreateProgramPayload,
  CreateSessionPayload,
  CreateSkillPayload,
  EnrollInProgramPayload,
  EnrollInSessionPayload,
  IssueCertificationPayload,
  MarkAttendancePayload,
  SubmitSessionFeedbackPayload,
  UpdateCoursePayload,
  UpdateProgramPayload,
} from "../types"

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) =>
      coursesApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCourses.all }),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCoursePayload }) =>
      coursesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCourses.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCourses.detail(id) })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => coursesApi.remove(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCourses.all }),
  })
}

export function useAddCourseModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddCourseModulePayload }) =>
      coursesApi.addModule(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCourses.detail(id) }),
  })
}

export function useAddCoursePrerequisite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AddCoursePrerequisitePayload
    }) => coursesApi.addPrerequisite(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCourses.detail(id) }),
  })
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProgramPayload) =>
      programsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.all }),
  })
}

export function useUpdateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProgramPayload }) =>
      programsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.all })
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.detail(id) })
    },
  })
}

export function useArchiveProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => programsApi.archive(id).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.all }),
  })
}

export function useAddCourseToProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AddCourseToProgramPayload
    }) => programsApi.addCourse(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.detail(id) }),
  })
}

export function useRemoveCourseFromProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId: string }) =>
      programsApi.removeCourse(id, courseId).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.detail(id) }),
  })
}

export function useCreateProgramCohort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: CreateProgramCohortPayload
    }) => programsApi.createCohort(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.detail(id) }),
  })
}

export function useEnrollInProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: EnrollInProgramPayload
    }) => programsApi.enroll(id, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.all }),
  })
}

export function useWithdrawFromProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      programsApi.withdraw(enrollmentId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingPrograms.all }),
  })
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) =>
      sessionsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingSessions.all }),
  })
}

export function useEnrollInSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: EnrollInSessionPayload
    }) => sessionsApi.enroll(id, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingSessions.all }),
  })
}

export function useCancelSessionEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      sessionsApi.cancelEnrollment(enrollmentId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingSessions.all }),
  })
}

export function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkAttendancePayload }) =>
      sessionsApi.markAttendance(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingSessions.detail(id) }),
  })
}

export function useSubmitSessionFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: SubmitSessionFeedbackPayload
    }) => sessionsApi.submitFeedback(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({
        queryKey: coreHrKeys.trainingSessions.feedbackSummary(id),
      }),
  })
}

// ─── Certifications ───────────────────────────────────────────────────────────

export function useIssueCertification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: IssueCertificationPayload) =>
      certificationsApi.issue(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingCertifications.all }),
  })
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export function useCreateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSkillPayload) =>
      skillsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingSkills.all }),
  })
}

export function useAssessEmployeeSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      skillId,
      payload,
    }: {
      employeeId: string
      skillId: string
      payload: AssessEmployeeSkillPayload
    }) =>
      skillsApi
        .assessEmployee(employeeId, skillId, payload)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.trainingSkills.all }),
  })
}

export function useAddRoleSkillRequirement() {
  return useMutation({
    mutationFn: (payload: AddRoleSkillRequirementPayload) =>
      skillsApi.addRoleRequirement(payload).then((r) => r.data.data),
  })
}
