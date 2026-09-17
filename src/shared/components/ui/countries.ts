/**
 * Dial-code data for `PhoneInput`. Deliberately a short, hand-picked list —
 * the app serves the MENA region first — rather than all ~250 ISO entries,
 * which would bury the countries that actually get used behind a long scroll.
 * Pass a `countries` prop to override it.
 */
export type Country = {
  /** ISO 3166-1 alpha-2, uppercase. Drives the flag lookup. */
  code: string
  name: string
  /** Includes the leading `+`. */
  dial: string
  /** Optional emoji fallback, used when the flag image cannot be resolved. */
  flag?: string
  /** Optional explicit flag image, overriding the ISO-derived URL. */
  flagUrl?: string
}

export const DEFAULT_COUNTRIES: Country[] = [
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "LY", name: "Libya", dial: "+218", flag: "🇱🇾" },
  { code: "SD", name: "Sudan", dial: "+249", flag: "🇸🇩" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "TR", name: "Türkiye", dial: "+90", flag: "🇹🇷" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
]

/**
 * E.164: a `+`, a non-zero country digit, then 7–15 digits in total. Good
 * enough to reject the obvious mistakes without shipping a per-country
 * numbering-plan table.
 */
export function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value)
}

/**
 * Joins a dial code to a national number. The trunk prefix people type out of
 * habit — `010…` in Egypt, `07…` in the UK — is not part of the international
 * form, so it is dropped; keeping it would store the same person under two
 * different numbers.
 */
export function toE164(dial: string, national: string): string {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "")
  return `${dial}${digits}`
}

/** Splits an E.164 string back into a country and its national part. */
export function splitE164(
  value: string,
  countries: Country[],
): { country: Country | undefined; national: string } {
  // Longest dial code first, so +1 never shadows a +1xxx country.
  const match = [...countries]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => value.startsWith(country.dial))

  return {
    country: match,
    national: match ? value.slice(match.dial.length) : "",
  }
}
