import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
})

export type Locale = (typeof routing.locales)[number]

const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"])

export function getLocaleDirection(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr"
}
