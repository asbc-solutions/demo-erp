import { z } from "zod"

/**
 * Digits with an optional leading "+" and common separators (spaces,
 * hyphens, parentheses). Rejects letters and other symbols like "!", "@".
 */
const PHONE_REGEX = /^\+?[\d\s()-]+$/
const PHONE_MESSAGE = "Please enter a valid phone number."

export const emergencyContactSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  full_name_local: z.string().trim().max(120).optional(),
  relationship: z.string().trim().min(1, "Relationship is required").max(80),
  phone_primary: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(30)
    .regex(PHONE_REGEX, PHONE_MESSAGE),
  phone_secondary: z
    .string()
    .trim()
    .max(30)
    .regex(PHONE_REGEX, PHONE_MESSAGE)
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(255).optional(),
  national_id: z.string().trim().max(30).optional(),
  is_primary: z.boolean().default(false),
})

export type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>
