export type JobLevel =
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal"
  | "manager"
  | "director"
  | "vp"
  | "c_level"

export type JobCategory =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary"

export type Job = {
  id: string
  job_code: string
  job_title: string
  job_title_local: string | null
  job_grade_id: string | null
  job_family: string
  job_subfamily: string | null
  job_level: JobLevel
  job_category: JobCategory
  job_description: string | null
  qualifications_required: string | null
  skills_required: string | null
  min_experience_years: number
  requires_approval: boolean
  is_active: boolean
  positions: unknown[]
  active_employee_count: number
  created_at: string
  updated_at: string
}

export type JobListParams = {
  page?: number
  per_page?: number
  search?: string
  job_family?: string
  job_level?: JobLevel
  job_category?: JobCategory
  job_grade_id?: string
  requires_approval?: boolean
  is_active?: boolean
}

export type CreateJobPayload = {
  job_code: string
  job_title: string
  job_title_local?: string
  job_grade_id?: string | null
  job_family: string
  job_subfamily?: string
  job_level: JobLevel
  job_category: JobCategory
  job_description?: string
  qualifications_required?: string
  skills_required?: string
  min_experience_years?: number
  requires_approval?: boolean
  is_active?: boolean
}

export type UpdateJobPayload = Omit<CreateJobPayload, "job_code">
