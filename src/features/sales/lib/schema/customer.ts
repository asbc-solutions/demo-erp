import { z } from "zod"

import type { CustomerAddress } from "../types"

/** Digits only. Rejects letters, spaces, and symbols like "+", "-", "(", ")". */
const PHONE_REGEX = /^[0-9]+$/
const PHONE_MESSAGE = "Please enter a valid phone number."
const PHONE_MAX_LENGTH = 11

/** Exactly 9 digits — Egyptian Tax Registration Number, no letters or separators. */
const TAX_NUMBER_REGEX = /^[0-9]{9}$/
const TAX_NUMBER_MESSAGE = "Please enter a valid Tax Number."
export const TAX_NUMBER_LENGTH = 9

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  customer_type: z.enum(["company", "individual"]),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(PHONE_MAX_LENGTH, PHONE_MESSAGE)
    .regex(PHONE_REGEX, PHONE_MESSAGE),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  tax_number: z
    .string()
    .trim()
    .regex(TAX_NUMBER_REGEX, TAX_NUMBER_MESSAGE)
    .optional()
    .or(z.literal("")),
  assigned_salesperson_id: z.string().trim().min(1, "Select a salesperson"),
  address_line: z.string().trim().optional(),
  address_city: z.string().trim().optional(),
  address_governorate: z.string().trim().optional(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const CUSTOMER_FORM_DEFAULT_VALUES: CustomerFormValues = {
  name: "",
  customer_type: "company",
  phone: "",
  email: "",
  tax_number: "",
  assigned_salesperson_id: "",
  address_line: "",
  address_city: "",
  address_governorate: "",
}

/**
 * Builds the single billing address entry from the form's address fields, or
 * omits it if any part is blank. When editing, preserve the existing record's
 * identity so the API updates that address instead of treating it as a new one.
 */
export function buildBillingAddress(
  values: CustomerFormValues,
  existingAddress?: CustomerAddress,
) {
  const line = values.address_line?.trim()
  const city = values.address_city?.trim()
  const governorate = values.address_governorate?.trim()
  if (!line || !city || !governorate) return undefined
  return [
    {
      ...existingAddress,
      address_type: "billing" as const,
      line,
      city,
      governorate,
      is_default: true,
    },
  ]
}
