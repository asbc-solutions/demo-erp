import { z } from "zod"

import { vk } from "./validation-key"

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
    grade_code: z.string().min(1, vk("gradeCodeRequired")),
    grade_name: z.string().min(1, vk("gradeNameRequired")),
    grade_name_local: z.string().optional(),
    grade_level: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .int(vk("mustBeWholeNumber"))
      .positive(vk("gradeLevelPositive")),
    grade_category: z.enum(gradeCategoryValues, {
      errorMap: () => ({ message: vk("selectCategory") }),
    }),
    min_salary: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .positive(vk("minSalaryPositive")),
    mid_salary: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .positive(vk("midSalaryPositive")),
    max_salary: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .positive(vk("maxSalaryPositive")),
    currency_code: z
      .string()
      .length(3, vk("currencyCodeLength"))
      .default("EGP"),
    description: z.string().optional(),
    overtime_eligible: z.boolean().default(false),
    annual_leave_days: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .int()
      .min(0, vk("cannotBeNegative"))
      .default(21),
    sick_leave_days: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .int()
      .min(0, vk("cannotBeNegative"))
      .default(10),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.min_salary <= data.mid_salary, {
    message: vk("midGteMin"),
    path: ["mid_salary"],
  })
  .refine((data) => data.mid_salary <= data.max_salary, {
    message: vk("maxGteMid"),
    path: ["max_salary"],
  })

export const validateBandSchema = z.object({
  job_grade_id: z.string().uuid(vk("selectJobGrade")),
  basic_salary: z
    .number({ invalid_type_error: vk("mustBeNumber") })
    .positive(vk("salaryPositive")),
})

export type JobGradeFormValues = z.infer<typeof jobGradeSchema>
export type ValidateBandFormValues = z.infer<typeof validateBandSchema>
