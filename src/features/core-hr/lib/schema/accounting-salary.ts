import { z } from "zod"

export const accountingSalarySchema = z.object({
  cost_centre_id: z.string().uuid("Please select a cost center"),
  pay_period: z
    .string()
    .min(1, "Pay period is required")
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      "Pay period must be in YYYY-MM format (e.g. 2026-06)"
    ),
  fiscal_year: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(2000, "Invalid fiscal year")
    .max(2100, "Invalid fiscal year"),
  fiscal_month: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  currency_code: z
    .string()
    .length(3, "Currency code must be 3 characters (ISO 4217)")
    .default("EGP"),
  gross_salary_budget: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be greater than 0"),
  gross_salary_actual: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be greater than 0"),
  net_salary_actual: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be greater than 0"),
  allowances_total: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative"),
  deductions_total: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative"),
  employer_contrib: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative"),
  gl_account_code: z.string().min(1, "GL account code is required"),
})

export type AccountingSalaryFormValues = z.infer<typeof accountingSalarySchema>
