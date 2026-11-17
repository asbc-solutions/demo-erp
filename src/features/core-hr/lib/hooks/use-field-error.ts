import { useTranslations } from "next-intl"

import { MINIMUM_EMPLOYEE_AGE } from "../schema/personal-info"
import type { HrValidationKey } from "../schema/validation-key"

/** Values for the placeholders some validation messages carry. */
const VALIDATION_VALUES = { age: MINIMUM_EMPLOYEE_AGE }

/**
 * Translates a form error message. Zod schemas in `lib/schema` carry
 * `HrValidation` keys; anything else (e.g. a server message set via
 * `setError`) is already display text and is returned unchanged.
 */
export function useFieldError() {
  const t = useTranslations("HrValidation")

  return (message: string | undefined): string | undefined => {
    if (!message) return message
    const key = message as HrValidationKey
    return t.has(key) ? t(key, VALIDATION_VALUES) : message
  }
}
