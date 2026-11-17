import type { useTranslations } from "next-intl"

type EmergencyContactsTranslator = ReturnType<
  typeof useTranslations<"HrEmergencyContacts">
>

/** The shared schema carries English messages; map the known ones to keys for display. */
const SCHEMA_ERROR_KEYS = {
  "Name is required": "errorNameRequired",
  "Relationship is required": "errorRelationshipRequired",
  "Phone is required": "errorPhoneRequired",
  "Please enter a valid phone number.": "errorPhoneInvalid",
  "Invalid email address": "errorEmailInvalid",
} as const

function isSchemaErrorMessage(
  message: string,
): message is keyof typeof SCHEMA_ERROR_KEYS {
  return message in SCHEMA_ERROR_KEYS
}

/** Localises a contact-form validation message, passing unknown ones through. */
export function contactErrorText(
  t: EmergencyContactsTranslator,
  message?: string,
) {
  return message && isSchemaErrorMessage(message)
    ? t(SCHEMA_ERROR_KEYS[message])
    : message
}
