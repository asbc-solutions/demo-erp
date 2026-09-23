import { z } from "zod"

export const programCategoryValues = [
  "compliance",
  "leadership",
  "management",
  "technical",
  "soft_skills",
  "development",
  "engineering",
] as const

export const programStatusValues = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
] as const

/** Number inputs registered with `valueAsNumber` yield NaN when left blank. */
const optionalPositiveNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .refine((v) => v === undefined || Number.isNaN(v) || v > 0, {
    message: "Must be greater than 0",
  })

export const trainingProgramSchema = z
  .object({
    program_code: z.string().trim().min(1, "Programme code is required"),
    program_name: z.string().trim().min(1, "Programme name is required"),
    category: z.enum(programCategoryValues, {
      errorMap: () => ({ message: "Please select a category" }),
    }),
    status: z.enum(programStatusValues, {
      errorMap: () => ({ message: "Please select a status" }),
    }),
    provider: z.string().optional(),
    target_audience: z.string().optional(),
    total_duration_hours: optionalPositiveNumber,
    cost_per_seat: optionalPositiveNumber,
    currency_code: z
      .string()
      .trim()
      .length(3, "Currency code must be 3 characters (ISO 4217)"),
    max_cohort_size: optionalPositiveNumber,
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.start_date || !data.end_date || data.start_date <= data.end_date,
    {
      message: "End date must be on or after the start date",
      path: ["end_date"],
    },
  )

export type TrainingProgramFormValues = z.infer<typeof trainingProgramSchema>
