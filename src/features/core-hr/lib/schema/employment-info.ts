import { z } from "zod"

import { vk } from "./validation-key"

/** Same custom message whether the value is missing (undefined) or empty. */
const requiredString = (message: string) =>
  z.string({ required_error: message, invalid_type_error: message }).min(1, message)

/**
 * Required fields on the Employment step of the add/edit employee stepper.
 * Optional fields (branch, position, grade, reports-to) are intentionally
 * omitted — unknown keys on the parsed object are ignored by zod.
 */
export const employmentInfoSchema = z.object({
  department: requiredString(vk("departmentRequired")),
  hireDate: requiredString(vk("hireDateRequired")),
  employmentType: requiredString(vk("employmentTypeRequired")),
})
