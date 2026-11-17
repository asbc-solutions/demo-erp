import type { Metadata } from "next"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { MarketingTrackingDashboard } from "@/src/features/marketing-tracking/components/marketing-tracking-dashboard"
import { routing } from "@/src/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "MarketingTrackingDashboard",
  })
  return { title: t("title") }
}

/**
 * Deliberately outside the `(pages)` route group: no session guard, no sidebar,
 * no header. Nothing links here and it is never added to `NAV_ITEMS` — the URL
 * is the only way in.
 */
export default function Page() {
  return <MarketingTrackingDashboard />
}
