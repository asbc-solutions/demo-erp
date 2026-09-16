import { z } from "zod"

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")

export const submitLeaveRequestSchema = z
  .object({
    leave_type_id: z.string().min(1, "Leave type is required"),
    start_date: dateString.min(1, "Start date is required"),
    end_date: dateString.min(1, "End date is required"),
    is_half_day: z.boolean().optional(),
    half_day_period: z.enum(["first_half", "second_half"]).optional(),
    reason: z.string().trim().max(500, "Reason is too long").optional(),
  })
  .superRefine((values, ctx) => {
    if (
      values.start_date &&
      values.end_date &&
      values.end_date < values.start_date
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date must be on or after the start date",
      })
    }

    if (values.is_half_day && values.start_date !== values.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "Half-day leave must start and end on the same date",
      })
    }

    if (values.is_half_day && !values.half_day_period) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["half_day_period"],
        message: "Select which half of the day",
      })
    }
  })

export type SubmitLeaveRequestFormValues = z.infer<
  typeof submitLeaveRequestSchema
>
