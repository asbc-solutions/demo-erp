import { MarketingTrackingDashboard } from "@/src/features/marketing-tracking/components/marketing-tracking-dashboard"

export const metadata = {
  title: "Demo Insights",
}

/**
 * Deliberately outside the `(pages)` route group: no session guard, no sidebar,
 * no header. Nothing links here and it is never added to `NAV_ITEMS` — the URL
 * is the only way in.
 */
export default function Page() {
  return <MarketingTrackingDashboard />
}
