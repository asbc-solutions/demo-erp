import { z } from "zod"

import { vk } from "./validation-key"

export const CHANGE_REASONS = [
  "hire",
  "promotion",
  "annual_review",
  "correction",
  "restructure",
  "market_adjustment",
] as const

export const CHANGE_TYPES = ["increase", "decrease", "correction"] as const

const optionalMoney = z.preprocess(
  (value) =>
    value === "" || value === undefined || Number.isNaN(value)
      ? undefined
      : value,
  z.coerce.number().min(0).optional()
)

export const salaryChangeSchema = z.object({
  employee_id: z.string().min(1, vk("employeeRequired")),
  basic_salary: z.coerce
    .number({ invalid_type_error: vk("mustBeNumber") })
    .positive(vk("basicSalaryPositive")),
  effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, vk("dateFormat")),
  change_reason: z.enum(CHANGE_REASONS, {
    required_error: vk("changeReasonRequired"),
  }),
  change_type: z.enum(CHANGE_TYPES, {
    required_error: vk("changeTypeRequired"),
  }),
  housing_allowance: optionalMoney,
  transport_allowance: optionalMoney,
  food_allowance: optionalMoney,
  mobile_allowance: optionalMoney,
  other_allowance: optionalMoney,
})

export type SalaryChangeFormValues = z.infer<typeof salaryChangeSchema>
