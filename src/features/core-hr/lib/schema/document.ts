import { z } from "zod"

export const DOCUMENT_TYPES = [
  "passport",
  "national_id",
  "birth_certificate",
  "work_permit",
  "visa",
  "degree_certificate",
  "professional_cert",
  "degree",
  "other",
] as const

export const DOCUMENT_CATEGORIES = [
  "identity",
  "legal",
  "educational",
  "professional",
  "medical",
  "internal",
  "other",
] as const

export const DOCUMENT_TYPE_LABELS: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  passport: "Passport",
  national_id: "National ID",
  birth_certificate: "Birth Certificate",
  work_permit: "Work Permit",
  visa: "Visa",
  degree_certificate: "Degree Certificate",
  professional_cert: "Professional Certificate",
  degree: "Degree",
  other: "Other",
}

export const DOCUMENT_CATEGORY_LABELS: Record<(typeof DOCUMENT_CATEGORIES)[number], string> = {
  identity: "Identity",
  legal: "Legal",
  educational: "Educational",
  professional: "Professional",
  medical: "Medical",
  internal: "Internal",
  other: "Other",
}

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .optional()
  .or(z.literal(""))

export const uploadDocumentSchema = z
  .object({
    document_type: z.enum(DOCUMENT_TYPES, {
      required_error: "Document type is required",
    }),
    document_category: z.enum(DOCUMENT_CATEGORIES, {
      required_error: "Category is required",
    }),
    document_title: z
      .string()
      .trim()
      .min(1, "Document title is required")
      .max(120),
    document_number: z.string().trim().max(60).optional(),
    issuing_authority: z.string().trim().max(120).optional(),
    issuing_country: z.string().trim().max(2).optional().or(z.literal("")),
    issue_date: optionalDate,
    expiry_date: optionalDate,
    alert_days_before: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1 day")
      .optional(),
    is_mandatory: z.boolean().default(false),
  })
  .superRefine((values, ctx) => {
    if (
      values.expiry_date &&
      values.issue_date &&
      values.expiry_date <= values.issue_date
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiry_date"],
        message: "Expiry date must be after issue date",
      })
    }
  })

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>
