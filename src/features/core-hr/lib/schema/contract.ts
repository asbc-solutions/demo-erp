import { z } from "zod"

import { vk } from "./validation-key"

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
  .regex(/^\d{4}-\d{2}-\d{2}$/, vk("dateFormat"))

const optionalDate = z.preprocess(
  (value) => (value === "" ? undefined : value),
  dateString.optional()
)

const optionalPositiveInt = (min: number, message: string) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined
    if (typeof value === "number" && Number.isNaN(value)) return undefined
    return value
  }, z.coerce.number().int(vk("mustBeWholeNumber")).min(min, message).optional())

export const contractSchema = z
  .object({
    employee_id: z.string().min(1, vk("employeeRequired")),
    contract_type: z.enum(CONTRACT_TYPES),
    start_date: dateString,
    end_date: optionalDate,
    is_open_ended: z.boolean().default(true),
    work_location: z.string().trim().max(120).optional(),
    work_schedule: z
      .string()
      .trim()
      .min(1, vk("workScheduleRequired"))
      .max(80, vk("workScheduleMax")),
    weekly_hours: optionalPositiveInt(1, vk("weeklyHoursMin")),
    probation_days: optionalPositiveInt(0, vk("probationNonNegative")),
    notice_period_days: optionalPositiveInt(
      0,
      vk("noticeNonNegative")
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
        message: vk("openEndedNoEndDate"),
      })
    }

    if (!values.is_open_ended && requiresEndDate && !values.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: vk("endDateRequiredForType"),
      })
    }

    if (values.end_date && values.end_date < values.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: vk("endAfterStart"),
      })
    }
  })

export type ContractFormValues = z.infer<typeof contractSchema>
