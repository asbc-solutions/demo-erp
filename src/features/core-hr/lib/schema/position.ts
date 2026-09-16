import { z } from "zod"

export const createPositionSchema = z
  .object({
    position_title: z
      .string()
      .min(1, "Position title is required")
      .max(200, "Title must be 200 characters or less"),
    position_code: z.string().optional(),
    dept_id: z.string().uuid("Invalid department").nullable().optional(),
    branch_id: z.string().uuid("Invalid branch").nullable().optional(),
    headcount_budget: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(1, "Headcount must be at least 1"),
    is_budgeted: z.boolean().default(true),
    effective_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .nullable()
      .optional(),
    expiry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .nullable()
      .optional(),
    is_active: z.boolean().default(true),
  })
  .refine(
    (d) =>
      !d.effective_date ||
      !d.expiry_date ||
      d.expiry_date >= d.effective_date,
    {
      message: "Expiry date must be on or after effective date",
      path: ["expiry_date"],
    },
  )

export type CreatePositionFormValues = z.infer<typeof createPositionSchema>
