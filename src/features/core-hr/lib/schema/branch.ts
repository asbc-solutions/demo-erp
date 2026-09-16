import { z } from "zod"

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
    .min(1, "Branch code is required")
    .max(50, "Branch code must be 50 characters or less"),
  branch_name: z
    .string()
    .min(1, "Branch name is required")
    .max(100, "Branch name must be 100 characters or less"),
  branch_name_local: z.string().optional(),
  branch_type: z.enum(branchTypeValues, {
    errorMap: () => ({ message: "Please select a branch type" }),
  }),
  parent_branch_id: z.string().uuid("Invalid branch ID").nullable().optional(),
  country_code: z
    .string()
    .length(2, "Country code must be 2 characters (ISO 3166-1)"),
  city: z.string().min(1, "City is required"),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  tax_id: z.string().nullable().optional(),
  manager_emp_id: z.string().uuid("Invalid employee ID").nullable().optional(),
  is_head_office: z.boolean().default(false),
  is_active: z.boolean().default(true),
  established_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .nullable()
    .optional(),
})

export type BranchFormValues = z.infer<typeof branchSchema>
