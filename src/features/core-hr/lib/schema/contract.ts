import { z } from "zod"

export const CONTRACT_TYPES = [
  "permanent",
  "fixed_term",
  "temporary",
  "internship",
  "contract",
  "seasonal",
  "secondment",
] as const

export const END_DATE_REQUIRED_CONTRACT_TYPES = [
  "fixed_term",
  "temporary",
  "internship",
  "seasonal",
] as const

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")

const optionalDate = z.preprocess(
  (value) => (value === "" ? undefined : value),
  dateString.optional()
)

const optionalPositiveInt = (min: number, message: string) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined
    if (typeof value === "number" && Number.isNaN(value)) return undefined
    return value
  }, z.coerce.number().int("Must be a whole number").min(min, message).optional())

export const contractSchema = z
  .object({
    employee_id: z.string().min(1, "Employee is required"),
    contract_type: z.enum(CONTRACT_TYPES),
    start_date: dateString,
    end_date: optionalDate,
    is_open_ended: z.boolean().default(true),
    work_location: z.string().trim().max(120).optional(),
    work_schedule: z
      .string()
      .trim()
      .min(1, "Work schedule is required")
      .max(80, "Work schedule must be 80 characters or less"),
    weekly_hours: optionalPositiveInt(1, "Weekly hours must be at least 1"),
    probation_days: optionalPositiveInt(0, "Probation days cannot be negative"),
    notice_period_days: optionalPositiveInt(
      0,
      "Notice period cannot be negative"
    ),
    notice_period_unit: z.enum(["day", "week", "month"]).optional(),
  })
  .superRefine((values, ctx) => {
    const requiresEndDate = END_DATE_REQUIRED_CONTRACT_TYPES.includes(
      values.contract_type as (typeof END_DATE_REQUIRED_CONTRACT_TYPES)[number]
    )

    if (values.is_open_ended && values.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "Open-ended contracts cannot have an end date",
      })
    }

    if (!values.is_open_ended && requiresEndDate && !values.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date is required for this contract type",
      })
    }

    if (values.end_date && values.end_date < values.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date must be on or after start date",
      })
    }
  })

export type ContractFormValues = z.infer<typeof contractSchema>
