"use client"

import { usePathname } from "next/navigation"
import { Hammer } from "lucide-react"

import { EmptyState } from "@/src/shared/components/ui/empty-state"

import { matchFinanceNav } from "../../lib/utils/nav"
import { FinancePageBody, FinancePageHeader } from "../shared/page-header"

/**
 * Stand-in for finance screens that are designed but not built yet. Real
 * routes replace it phase by phase; it is deleted once every nav item has one.
 */
function FinancePlaceholderPage() {
  const pathname = usePathname()
  const match = matchFinanceNav(pathname)
  const title = match?.item.label ?? "Finance"

  return (
    <>
      <FinancePageHeader title={title} />
      <FinancePageBody>
        <EmptyState
          variant="card"
          icon={<Hammer />}
          title={`${title} arrives in phase ${match?.phase ?? "—"}`}
          description={
            match
              ? `This screen is part of the ${match.group.label} section of the Finance rebuild. Its design is ready; it is built in phase ${match.phase}.`
              : "This finance screen has not been built yet."
          }
        />
      </FinancePageBody>
    </>
  )
}

export { FinancePlaceholderPage }
