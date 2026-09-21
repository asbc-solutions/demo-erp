import { FINANCE_NAV_GROUPS } from "@/src/shared/lib/constants/finance-nav"
import { pathnameMatches } from "@/src/shared/lib/constants/modules"
import type { NavChild, NavGroup } from "@/src/shared/lib/types"

export type FinanceNavMatch = {
  group: NavGroup
  item: NavChild
  /** 1-based position of the group, which is also its build phase. */
  phase: number
}

/** The nav item a finance pathname belongs to — longest href wins, like the sidebar. */
export function matchFinanceNav(pathname: string): FinanceNavMatch | null {
  let best: (FinanceNavMatch & { length: number }) | null = null

  FINANCE_NAV_GROUPS.forEach((group, index) => {
    for (const item of group.items) {
      if (!item.href || !pathnameMatches(pathname, item.href)) continue
      if (!best || item.href.length > best.length) {
        best = { group, item, phase: index + 1, length: item.href.length }
      }
    }
  })

  if (!best) return null
  const { group, item, phase } = best
  return { group, item, phase }
}
