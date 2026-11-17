import { z } from "zod"

import { vk } from "./validation-key"

export const createPositionSchema = z
  .object({
    position_title: z
      .string()
      .min(1, vk("positionTitleRequired"))
      .max(200, vk("titleMax")),
    position_code: z.string().optional(),
    dept_id: z.string().uuid(vk("invalidDepartment")).nullable().optional(),
    branch_id: z.string().uuid(vk("invalidBranch")).nullable().optional(),
    headcount_budget: z
      .number({ invalid_type_error: vk("mustBeNumber") })
      .int(vk("mustBeWholeNumber"))
      .min(1, vk("headcountMin")),
    is_budgeted: z.boolean().default(true),
    effective_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, vk("dateFormat"))
      .nullable()
      .optional(),
    expiry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, vk("dateFormat"))
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
      message: vk("expiryAfterEffective"),
      path: ["expiry_date"],
    },
  )

export type CreatePositionFormValues = z.infer<typeof createPositionSchema>
