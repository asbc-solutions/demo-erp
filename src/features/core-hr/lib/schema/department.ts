import { z } from "zod"

export const deptTypeValues = [
  "operational",
  "administrative",
  "support",
  "technical",
  "management",
] as const

export const departmentSchema = z.object({
  branch_id: z.string().uuid("Please select a branch"),
  dept_code: z.string().min(1, "Department code is required"),
  dept_name: z.string().min(1, "Department name is required"),
  dept_name_local: z.string().optional(),
  dept_type: z.enum(deptTypeValues, {
    errorMap: () => ({ message: "Please select a department type" }),
  }),
  parent_dept_id: z
    .string()
    .uuid("Invalid department ID")
    .nullable()
    .optional(),
  headcount_budget: z
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be a whole number")
    .positive("Headcount must be greater than 0"),
  effective_date: z
    .string()
    .min(1, "Effective date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  is_active: z.boolean().default(true),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>
