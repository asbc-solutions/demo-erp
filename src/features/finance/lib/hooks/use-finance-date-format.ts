import { useLocale } from "next-intl"

import { createFinanceDateFormat, type FinanceDateFormat } from "../utils/date"

/** Finance date formatters bound to the active UI locale (stable per locale). */
export function useFinanceDateFormat(): FinanceDateFormat {
  return createFinanceDateFormat(useLocale())
}
