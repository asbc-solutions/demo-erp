import type { Messages } from "next-intl"

/** A key of the `HrValidation` namespace (`src/i18n/messages/en/hr-people.json`). */
export type HrValidationKey = keyof Messages["HrValidation"]

/**
 * Marks a zod message as an `HrValidation` message key. Schemas live at module
 * level, so they carry keys and the form translates them where the error is
 * rendered — see `useFieldError` in `lib/hooks/use-field-error.ts`.
 */
export function vk(key: HrValidationKey): HrValidationKey {
  return key
}
