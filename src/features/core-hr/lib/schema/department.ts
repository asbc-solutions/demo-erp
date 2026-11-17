import { z } from "zod"

import { vk } from "./validation-key"

export const deptTypeValues = [
  "operational",
  "administrative",
  "support",
  "technical",
  "management",
] as const

export const departmentSchema = z.object({
  branch_id: z.string().uuid(vk("selectBranch")),
  dept_code: z.string().min(1, vk("deptCodeRequired")),
  dept_name: z.string().min(1, vk("deptNameRequired")),
  dept_name_local: z.string().optional(),
  dept_type: z.enum(deptTypeValues, {
    errorMap: () => ({ message: vk("selectDeptType") }),
  }),
  parent_dept_id: z
    .string()
    .uuid(vk("invalidDepartmentId"))
    .nullable()
    .optional(),
  headcount_budget: z
    .number({ invalid_type_error: vk("mustBeNumber") })
    .int(vk("mustBeWholeNumber"))
    .positive(vk("headcountPositive")),
  effective_date: z
    .string()
    .min(1, vk("effectiveDateRequired"))
    .regex(/^\d{4}-\d{2}-\d{2}$/, vk("dateFormat")),
  is_active: z.boolean().default(true),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>
