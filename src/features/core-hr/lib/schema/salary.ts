import { z } from "zod"

export const CHANGE_REASONS = [
  "hire",
  "promotion",
  "annual_review",
  "correction",
  "restructure",
  "market_adjustment",
] as const

export const CHANGE_TYPES = ["increase", "decrease", "correction"] as const

export const CHANGE_REASON_LABELS: Record<(typeof CHANGE_REASONS)[number], string> = {
  hire: "New hire",
  promotion: "Promotion",
  annual_review: "Annual review",
  correction: "Correction",
  restructure: "Restructure",
  market_adjustment: "Market adjustment",
}

export const CHANGE_TYPE_LABELS: Record<(typeof CHANGE_TYPES)[number], string> = {
  increase: "Increase",
  decrease: "Decrease",
  correction: "Correction",
}

const optionalMoney = z.preprocess(
  (value) =>
    value === "" || value === undefined || Number.isNaN(value)
      ? undefined
      : value,
  z.coerce.number().min(0).optional()
)

export const salaryChangeSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  basic_salary: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .positive("Basic salary must be greater than 0"),
  effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  change_reason: z.enum(CHANGE_REASONS, {
    required_error: "Change reason is required",
  }),
  change_type: z.enum(CHANGE_TYPES, {
    required_error: "Change type is required",
  }),
  housing_allowance: optionalMoney,
  transport_allowance: optionalMoney,
  food_allowance: optionalMoney,
  mobile_allowance: optionalMoney,
  other_allowance: optionalMoney,
})

export type SalaryChangeFormValues = z.infer<typeof salaryChangeSchema>
