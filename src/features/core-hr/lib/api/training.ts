import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  AddCourseModulePayload,
  AddCoursePrerequisitePayload,
  AddCourseToProgramPayload,
  AddRoleSkillRequirementPayload,
  AssessEmployeeSkillPayload,
  CertificationListParams,
  Course,
  CourseListParams,
  CourseModule,
  CreateCoursePayload,
  CreateProgramCohortPayload,
  CreateProgramPayload,
  CreateSessionPayload,
  CreateSkillPayload,
  EmployeeSkill,
  EnrollInProgramPayload,
  EnrollInSessionPayload,
  IssueCertificationPayload,
  MarkAttendancePayload,
  ProgramCohort,
  ProgramCourse,
  ProgramEnrollment,
  ProgramListParams,
  RoleSkillRequirement,
  SessionEnrollment,
  SessionFeedbackSummary,
  SessionListParams,
  Skill,
  SkillGap,
  SkillListParams,
  SubmitSessionFeedbackPayload,
  TrainingCertification,
  TrainingProgram,
  TrainingSession,
  UpdateCoursePayload,
  UpdateProgramPayload,
} from "../types"

type Paginated<T> = Omit<ApiResponse<T>, "meta"> & { meta: PaginationMeta }

// ─── Courses ──────────────────────────────────────────────────────────────────

export const coursesApi = {
  list: (params?: CourseListParams) =>
    httpClient.get<Paginated<Course[]>>("/training/courses", { params }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Course>>(`/training/courses/${id}`),

  create: (payload: CreateCoursePayload) =>
    httpClient.post<ApiResponse<Course>>("/training/courses", payload),

  update: (id: string, payload: UpdateCoursePayload) =>
    httpClient.put<ApiResponse<Course>>(`/training/courses/${id}`, payload),

  remove: (id: string) =>
    httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/training/courses/${id}`,
    ),

  addModule: (id: string, payload: AddCourseModulePayload) =>
    httpClient.post<ApiResponse<CourseModule>>(
      `/training/courses/${id}/modules`,
      payload,
    ),

  addPrerequisite: (id: string, payload: AddCoursePrerequisitePayload) =>
    httpClient.post<ApiResponse<{ prereq_id: string }>>(
      `/training/courses/${id}/prerequisites`,
      payload,
    ),
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export const programsApi = {
  list: (params?: ProgramListParams) =>
    httpClient.get<Paginated<TrainingProgram[]>>("/training/programs", {
      params,
    }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<TrainingProgram>>(`/training/programs/${id}`),

  create: (payload: CreateProgramPayload) =>
    httpClient.post<ApiResponse<TrainingProgram>>("/training/programs", payload),

  update: (id: string, payload: UpdateProgramPayload) =>
    httpClient.put<ApiResponse<TrainingProgram>>(
      `/training/programs/${id}`,
      payload,
    ),

  archive: (id: string) =>
    httpClient.delete<ApiResponse<{ archived: boolean }>>(
      `/training/programs/${id}`,
    ),

  addCourse: (id: string, payload: AddCourseToProgramPayload) =>
    httpClient.post<ApiResponse<ProgramCourse>>(
      `/training/programs/${id}/courses`,
      payload,
    ),

  removeCourse: (id: string, courseId: string) =>
    httpClient.delete<ApiResponse<{ removed: boolean }>>(
      `/training/programs/${id}/courses/${courseId}`,
    ),

  createCohort: (id: string, payload: CreateProgramCohortPayload) =>
    httpClient.post<ApiResponse<ProgramCohort>>(
      `/training/programs/${id}/cohorts`,
      payload,
    ),

  enroll: (id: string, payload: EnrollInProgramPayload) =>
    httpClient.post<ApiResponse<ProgramEnrollment>>(
      `/training/programs/${id}/enroll`,
      payload,
    ),

  withdraw: (enrollmentId: string) =>
    httpClient.post<ApiResponse<{ withdrawn: boolean }>>(
      `/training/program-enrollments/${enrollmentId}/withdraw`,
      {},
    ),
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list: (params?: SessionListParams) =>
    httpClient.get<Paginated<TrainingSession[]>>("/training/sessions", {
      params,
    }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<TrainingSession>>(`/training/sessions/${id}`),

  create: (payload: CreateSessionPayload) =>
    httpClient.post<ApiResponse<TrainingSession>>("/training/sessions", payload),

  enroll: (id: string, payload: EnrollInSessionPayload) =>
    httpClient.post<ApiResponse<SessionEnrollment>>(
      `/training/sessions/${id}/enroll`,
      payload,
    ),

  cancelEnrollment: (enrollmentId: string) =>
    httpClient.post<ApiResponse<{ cancelled: boolean }>>(
      `/training/session-enrollments/${enrollmentId}/cancel`,
      {},
    ),

  markAttendance: (id: string, payload: MarkAttendancePayload) =>
    httpClient.post<ApiResponse<unknown>>(
      `/training/sessions/${id}/attendance`,
      payload,
    ),

  submitFeedback: (id: string, payload: SubmitSessionFeedbackPayload) =>
    httpClient.post<ApiResponse<{ feedback_id: string }>>(
      `/training/sessions/${id}/feedback`,
      payload,
    ),

  feedbackSummary: (id: string) =>
    httpClient.get<ApiResponse<SessionFeedbackSummary>>(
      `/training/sessions/${id}/feedback-summary`,
    ),
}

// ─── Certifications ───────────────────────────────────────────────────────────

export const certificationsApi = {
  list: (params?: CertificationListParams) =>
    httpClient.get<Paginated<TrainingCertification[]>>(
      "/training/certifications",
      { params },
    ),

  mine: () =>
    httpClient.get<ApiResponse<TrainingCertification[]>>(
      "/training/certifications/me",
    ),

  issue: (payload: IssueCertificationPayload) =>
    httpClient.post<ApiResponse<TrainingCertification>>(
      "/training/certifications/issue",
      payload,
    ),
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export const skillsApi = {
  list: (params?: SkillListParams) =>
    httpClient.get<Paginated<Skill[]>>("/training/skills", { params }),

  create: (payload: CreateSkillPayload) =>
    httpClient.post<ApiResponse<Skill>>("/training/skills", payload),

  assessEmployee: (
    employeeId: string,
    skillId: string,
    payload: AssessEmployeeSkillPayload,
  ) =>
    httpClient.post<ApiResponse<EmployeeSkill>>(
      `/training/employee-skills/${employeeId}/assess/${skillId}`,
      payload,
    ),

  gapAnalysis: (employeeId: string, jobGradeId: string) =>
    httpClient.get<ApiResponse<SkillGap[]>>(
      `/training/employees/${employeeId}/skill-gaps/${jobGradeId}`,
    ),

  addRoleRequirement: (payload: AddRoleSkillRequirementPayload) =>
    httpClient.post<ApiResponse<RoleSkillRequirement>>(
      "/training/role-skill-requirements",
      payload,
    ),
}
