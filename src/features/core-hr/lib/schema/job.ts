import { z } from "zod"

export const jobLevelValues = [
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "manager",
  "director",
  "vp",
  "c_level",
] as const

export const jobCategoryValues = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
] as const

export const createJobSchema = z.object({
  job_code: z.string().min(1, "Job code is required"),
  job_title: z.string().min(1, "Job title is required"),
  job_title_local: z.string().optional(),
  job_grade_id: z.string().uuid("Invalid grade ID").nullable().optional(),
  job_family: z.string().min(1, "Job family is required"),
  job_subfamily: z.string().optional(),
  job_level: z.enum(jobLevelValues, {
    errorMap: () => ({ message: "Please select a job level" }),
  }),
  job_category: z.enum(jobCategoryValues, {
    errorMap: () => ({ message: "Please select a job category" }),
  }),
  job_description: z.string().optional(),
  qualifications_required: z.string().optional(),
  skills_required: z.string().optional(),
  min_experience_years: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0, "Cannot be negative")
    .default(0),
  requires_approval: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

// Update schema omits job_code (immutable)
export const updateJobSchema = createJobSchema.omit({ job_code: true })

export type CreateJobFormValues = z.infer<typeof createJobSchema>
export type UpdateJobFormValues = z.infer<typeof updateJobSchema>
