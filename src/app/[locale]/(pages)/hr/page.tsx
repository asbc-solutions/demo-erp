import { getLocale } from "next-intl/server"

import { redirect } from "@/src/i18n/navigation"
import { HR_DEFAULT_ROUTE } from "@/src/shared/lib/constants/hr-nav"

export default async function HrPage() {
  redirect({ href: HR_DEFAULT_ROUTE, locale: await getLocale() })
}
