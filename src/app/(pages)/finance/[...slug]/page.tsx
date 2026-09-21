import { notFound } from "next/navigation"

import { FinancePlaceholderPage } from "@/src/features/finance/components/shell/finance-placeholder-page"
import { matchFinanceNav } from "@/src/features/finance/lib/utils/nav"

/**
 * Catch-all for finance screens that are designed but not built yet, so no
 * nav link 404s mid-rebuild. Real routes outrank it; it is deleted in phase 11.
 */
const FinancePlaceholderRoute = async ({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) => {
  const { slug } = await params
  if (!matchFinanceNav(`/finance/${slug.join("/")}`)) notFound()
  return <FinancePlaceholderPage />
}

export default FinancePlaceholderRoute
