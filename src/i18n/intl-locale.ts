import { useLocale } from "next-intl"

import type { Locale } from "./routing"

/**
 * BCP 47 tags for `Intl.*` / `toLocale*String`. Arabic keeps Latin digits
 * (`nu-latn`): amounts and IDs stay copy-pasteable and line up with the
 * English UI, while month and weekday names are localised.
 */
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-EG-u-nu-latn",
}

export function toIntlLocale(locale: Locale): string {
  return INTL_LOCALE[locale]
}

/** The `Intl` locale tag for the active UI locale. */
export function useIntlLocale(): string {
  return toIntlLocale(useLocale())
}
