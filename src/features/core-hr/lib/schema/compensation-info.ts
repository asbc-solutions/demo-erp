import { z } from "zod"

/** Required fields on the Compensation step of the add/edit employee stepper. */
export const compensationInfoSchema = z.object({
  grossAnnual: z
    .number({
      required_error: "Gross Salary is required.",
      invalid_type_error: "Gross Salary is required.",
    })
    .positive("Gross Salary must be greater than 0."),
  contractType: z.enum(["PERMANENT", "FIXED_TERM", "PROBATION"], {
    errorMap: () => ({ message: "Contract Type is required." }),
  }),
  contractStart: z
    .string({ required_error: "Contract Start Date is required." })
    .min(1, "Contract Start Date is required."),
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
      message: "Contract start date must be before the hiring date.",
      path: ["contractStart"],
    },
  )
