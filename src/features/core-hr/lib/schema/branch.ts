import { z } from "zod"

import { vk } from "./validation-key"

export const branchTypeValues = [
  "head_office",
  "regional_office",
  "branch",
  "warehouse",
  "site",
] as const

export const branchSchema = z.object({
  branch_code: z
    .string()
    .min(1, vk("branchCodeRequired"))
    .max(50, vk("branchCodeMax")),
  branch_name: z
    .string()
    .min(1, vk("branchNameRequired"))
    .max(100, vk("branchNameMax")),
  branch_name_local: z.string().optional(),
  branch_type: z.enum(branchTypeValues, {
    errorMap: () => ({ message: vk("selectBranchType") }),
  }),
  parent_branch_id: z.string().uuid(vk("invalidBranchId")).nullable().optional(),
  country_code: z
    .string()
    .length(2, vk("countryCodeLength")),
  city: z.string().min(1, vk("cityRequired")),
  address_line1: z.string().min(1, vk("addressRequired")),
  address_line2: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email(vk("invalidEmail")).nullable().optional().or(z.literal("")),
  tax_id: z.string().nullable().optional(),
  manager_emp_id: z.string().uuid(vk("invalidEmployeeId")).nullable().optional(),
  is_head_office: z.boolean().default(false),
  is_active: z.boolean().default(true),
  established_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, vk("dateFormat"))
    .nullable()
    .optional(),
})

export type BranchFormValues = z.infer<typeof branchSchema>
