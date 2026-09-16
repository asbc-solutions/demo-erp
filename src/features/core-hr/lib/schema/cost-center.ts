import { z } from "zod"

export const ccTypeValues = [
  "cost_centre",
  "profit_centre",
  "investment_centre",
  "revenue_centre",
] as const

export const createCostCenterSchema = z.object({
  cc_code: z.string().min(1, "Cost center code is required"),
  cc_name: z.string().min(1, "Cost center name is required"),
  cc_name_local: z.string().optional(),
  cc_type: z.enum(ccTypeValues, {
    errorMap: () => ({ message: "Please select a type" }),
  }),
  branch_id: z.string().uuid("Please select a branch"),
  dept_id: z.string().uuid("Please select a department"),
  account_code: z.string().min(1, "Account code is required"),
  currency_code: z
    .string()
    .length(3, "Currency code must be 3 characters (ISO 4217)")
    .default("EGP"),
  budget_amount: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Budget must be greater than 0"),
  fiscal_year: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(2000, "Invalid fiscal year")
    .max(2100, "Invalid fiscal year"),
  is_active: z.boolean().default(true),
})

// Update schema omits immutable fields
export const updateCostCenterSchema = createCostCenterSchema.omit({
  cc_code: true,
  fiscal_year: true,
})

export type CreateCostCenterFormValues = z.infer<typeof createCostCenterSchema>
export type UpdateCostCenterFormValues = z.infer<typeof updateCostCenterSchema>
