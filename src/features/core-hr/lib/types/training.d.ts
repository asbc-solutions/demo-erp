// ─── Courses ──────────────────────────────────────────────────────────────────

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "expert"
/** Open string union — backend accepts classroom / e_learning / virtual / blended / self_paced. */
export type DeliveryMode = string

export type Course = {
  course_id: string
  course_code: string
  course_name: string
  course_name_local?: string
  category: string
  delivery_mode: DeliveryMode
  level: CourseLevel
  duration_hours: number
  provider?: string | null
  cost_per_seat?: number | null
  currency_code?: string | null
  passing_score?: number | null
  validity_months?: number | null
  is_mandatory: boolean
  is_active: boolean
  /** Present when the API expands the parent programme. */
  program_name?: string | null
  created_at?: string
  updated_at?: string
}

export type CourseListParams = {
  category?: string
  delivery_mode?: DeliveryMode
  level?: CourseLevel
  is_mandatory?: boolean
  is_active?: boolean
  search?: string
  page?: number
  per_page?: number
}

export type CreateCoursePayload = {
  course_code: string
  course_name: string
  course_name_local?: string
  category: string
  delivery_mode: DeliveryMode
  level: CourseLevel
  duration_hours: number
  provider?: string
  cost_per_seat?: number
  currency_code?: string
  passing_score?: number
  validity_months?: number
  is_mandatory?: boolean
  is_active?: boolean
}

export type UpdateCoursePayload = Partial<Omit<CreateCoursePayload, "course_code">>

export type CourseModule = {
  module_id: string
  course_id: string
  sequence_order: number
  title: string
  description?: string | null
  material_url?: string | null
  duration_minutes?: number | null
}

export type AddCourseModulePayload = {
  sequence_order: number
  title: string
  description?: string
  material_url?: string
  duration_minutes?: number
}

export type AddCoursePrerequisitePayload = {
  prerequisite_course_id: string
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export type ProgramStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived"

export type TrainingProgram = {
  program_id: string
  program_code: string
  program_name: string
  program_name_local?: string
  category: string
  description?: string | null
  status: ProgramStatus
  provider?: string | null
  owner_emp_id?: string | null
  target_audience?: string | null
  total_duration_hours?: number | null
  cost_per_seat?: number | null
  currency_code?: string | null
  max_cohort_size?: number | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean
  /** Present when the API expands enrollment aggregates. */
  enrolled_count?: number | null
  created_at?: string
  updated_at?: string
}

export type ProgramListParams = {
  status?: ProgramStatus
  category?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export type CreateProgramPayload = {
  program_code: string
  program_name: string
  program_name_local?: string
  category: string
  description?: string
  status?: ProgramStatus
  provider?: string
  owner_emp_id?: string
  target_audience?: string
  total_duration_hours?: number
  cost_per_seat?: number
  currency_code?: string
  max_cohort_size?: number
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export type UpdateProgramPayload = Partial<
  Pick<
    CreateProgramPayload,
    | "program_name"
    | "program_name_local"
    | "category"
    | "description"
    | "status"
    | "start_date"
    | "end_date"
  >
>

export type AddCourseToProgramPayload = {
  course_id: string
  sequence_order?: number
  is_mandatory?: boolean
}

export type ProgramCourse = {
  program_course_id: string
  program_id: string
  course_id: string
  sequence_order?: number
  is_mandatory?: boolean
}

// ─── Cohorts & Program Enrollment ─────────────────────────────────────────────

export type CohortStatus =
  | "planned"
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled"

export type ProgramCohort = {
  cohort_id: string
  program_id: string
  cohort_name: string
  start_date: string
  end_date: string
  capacity: number
  enrolled_count?: number
  status: CohortStatus
}

export type CreateProgramCohortPayload = {
  cohort_name: string
  start_date: string
  end_date: string
  capacity: number
  status?: CohortStatus
}

export type ProgramEnrollment = {
  enrollment_id: string
  program_id: string
  employee_id: string
  cohort_id?: string | null
  status: string
  enrolled_at?: string
}

export type EnrollInProgramPayload = {
  employee_id: string
  cohort_id?: string
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "scheduled"
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled"

export type TrainingSession = {
  session_id: string
  course_id: string
  cohort_id?: string | null
  start_datetime: string
  end_datetime: string
  trainer_emp_id?: string | null
  external_trainer?: string | null
  venue?: string | null
  delivery_mode?: DeliveryMode
  max_seats: number
  enrolled_count?: number
  waitlist_count?: number
  status: SessionStatus
}

export type SessionListParams = {
  course_id?: string
  cohort_id?: string
  status?: SessionStatus
  page?: number
  per_page?: number
}

export type CreateSessionPayload = {
  course_id: string
  cohort_id?: string
  start_datetime: string
  end_datetime: string
  trainer_emp_id?: string
  external_trainer?: string
  venue?: string
  delivery_mode: DeliveryMode
  max_seats: number
  status?: SessionStatus
}

export type SessionEnrollment = {
  enrollment_id: string
  session_id: string
  employee_id: string
  status: string
  enrolled_at?: string
}

export type EnrollInSessionPayload = {
  employee_id: string
}

export type AttendanceInput = {
  employee_id: string
  attended: boolean
  score?: number
}

export type MarkAttendancePayload = {
  attendances: AttendanceInput[]
}

export type SubmitSessionFeedbackPayload = {
  employee_id: string
  content_rating: number
  trainer_rating: number
  relevance_rating: number
  would_recommend: boolean
  comments?: string
}

export type SessionFeedbackSummary = {
  session_id: string
  total_responses: number
  avg_content_rating: number
  avg_trainer_rating: number
  avg_relevance_rating: number
  recommendation_rate: number
}

// ─── Certifications ───────────────────────────────────────────────────────────

export type TrainingCertStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "revoked"

export type TrainingCertification = {
  cert_id: string
  employee_id?: string
  course_id?: string | null
  cert_name: string
  cert_name_local?: string
  issuing_body?: string | null
  obtained_date: string
  expiry_date?: string | null
  certificate_url?: string | null
  status: TrainingCertStatus
  /** Present when the API expands the employee relation. */
  employee_name?: string | null
}

export type CertificationListParams = {
  employee_id?: string
  course_id?: string
  status?: TrainingCertStatus
  expiring_within_days?: number
  page?: number
  per_page?: number
}

export type IssueCertificationPayload = {
  employee_id: string
  course_id: string
  cert_name: string
  cert_name_local?: string
  issuing_body?: string
  obtained_date: string
  expiry_date?: string
  certificate_url?: string
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export type Skill = {
  skill_id: string
  skill_code: string
  skill_name: string
  skill_name_local?: string
  category: string
  description?: string | null
  is_active: boolean
}

export type SkillListParams = {
  category?: string
  is_active?: boolean
  search?: string
  page?: number
  per_page?: number
}

export type CreateSkillPayload = {
  skill_code: string
  skill_name: string
  skill_name_local?: string
  category: string
  description?: string
  is_active?: boolean
}

export type SkillAssessmentSource =
  | "self"
  | "manager"
  | "assessment"
  | "certification"
  | "training"

export type EmployeeSkill = {
  emp_skill_id: string
  employee_id: string
  skill_id: string
  current_level: number
  target_level?: number | null
  source: SkillAssessmentSource
  assessed_at?: string
}

export type AssessEmployeeSkillPayload = {
  current_level: number
  target_level?: number
  source: SkillAssessmentSource
  assessed_by?: string
}

export type SkillGap = {
  skill_id: string
  skill_name: string
  required_level: number
  current_level: number
  gap: number
}

export type AddRoleSkillRequirementPayload = {
  job_grade_id: string
  skill_id: string
  required_level: number
}

export type RoleSkillRequirement = {
  req_id: string
  job_grade_id: string
  skill_id: string
  required_level: number
}
