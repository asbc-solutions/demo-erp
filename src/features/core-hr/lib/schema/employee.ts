import { z } from "zod"

import { dateOfBirthSchema } from "./personal-info"

export const createEmployeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email_work: z.string().email("Invalid email address"),
  hire_date: z.string().min(1, "Hire date is required"),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]),
  phone_mobile: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).optional().nullable(),
  nationality: z
    .string()
    .length(3, "Nationality must be a 3-letter ISO code (e.g. EGY)")
    .optional()
    .nullable(),
  national_id: z.string().optional().nullable(),
  date_of_birth: dateOfBirthSchema.optional().nullable(),
  blood_type: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z
    .string()
    .length(3, "Country must be a 3-letter ISO code (e.g. EGY)")
    .optional()
    .nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  dept_id: z.string().uuid().optional().nullable(),
  position_id: z.string().uuid().optional().nullable(),
  job_grade_id: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>
