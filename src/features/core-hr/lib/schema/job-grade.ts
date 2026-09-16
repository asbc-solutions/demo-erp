import { z } from "zod"

export const gradeCategoryValues = [
  "executive",
  "management",
  "professional",
  "technical",
  "administrative",
  "operational",
] as const

export const jobGradeSchema = z
  .object({
    grade_code: z.string().min(1, "Grade code is required"),
    grade_name: z.string().min(1, "Grade name is required"),
    grade_name_local: z.string().optional(),
    grade_level: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .positive("Grade level must be greater than 0"),
    grade_category: z.enum(gradeCategoryValues, {
      errorMap: () => ({ message: "Please select a category" }),
    }),
    min_salary: z
      .number({ invalid_type_error: "Must be a number" })
      .positive("Minimum salary must be greater than 0"),
    mid_salary: z
      .number({ invalid_type_error: "Must be a number" })
      .positive("Mid salary must be greater than 0"),
    max_salary: z
      .number({ invalid_type_error: "Must be a number" })
      .positive("Maximum salary must be greater than 0"),
    currency_code: z
      .string()
      .length(3, "Currency code must be 3 characters (ISO 4217)")
      .default("EGP"),
    description: z.string().optional(),
    overtime_eligible: z.boolean().default(false),
    annual_leave_days: z
      .number({ invalid_type_error: "Must be a number" })
      .int()
      .min(0, "Cannot be negative")
      .default(21),
    sick_leave_days: z
      .number({ invalid_type_error: "Must be a number" })
      .int()
      .min(0, "Cannot be negative")
      .default(10),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.min_salary <= data.mid_salary, {
    message: "Mid salary must be ≥ minimum salary",
    path: ["mid_salary"],
  })
  .refine((data) => data.mid_salary <= data.max_salary, {
    message: "Maximum salary must be ≥ mid salary",
    path: ["max_salary"],
  })

export const validateBandSchema = z.object({
  job_grade_id: z.string().uuid("Please select a job grade"),
  basic_salary: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Salary must be greater than 0"),
})

export type JobGradeFormValues = z.infer<typeof jobGradeSchema>
export type ValidateBandFormValues = z.infer<typeof validateBandSchema>
