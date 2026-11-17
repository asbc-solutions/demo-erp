import { z } from "zod"

import { vk } from "./validation-key"

/** Required fields on the Compensation step of the add/edit employee stepper. */
export const compensationInfoSchema = z.object({
  grossAnnual: z
    .number({
      required_error: vk("grossSalaryRequired"),
      invalid_type_error: vk("grossSalaryRequired"),
    })
    .positive(vk("grossSalaryPositive")),
  contractType: z.enum(["PERMANENT", "FIXED_TERM", "PROBATION"], {
    errorMap: () => ({ message: vk("contractTypeRequired") }),
  }),
  contractStart: z
    .string({ required_error: vk("contractStartRequired") })
    .min(1, vk("contractStartRequired")),
})

/**
 * Cross-field rule for the Compensation step: when both dates are present, the
 * contract start date must fall before the employee's hiring date. Dates are
 * "YYYY-MM-DD" strings, so a lexicographic comparison orders them correctly.
 */
export const contractStartSchema = z
  .object({
    hireDate: z.string(),
    contractStart: z.string(),
  })
  .refine(
    ({ hireDate, contractStart }) =>
      !hireDate || !contractStart || contractStart < hireDate,
    {
      message: vk("contractStartBeforeHire"),
      path: ["contractStart"],
    },
  )
