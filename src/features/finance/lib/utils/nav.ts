import { FINANCE_HOME_ROUTE, FINANCE_NAV_GROUPS } from "@/src/shared/lib/constants/finance-nav"
import { pathnameMatches } from "@/src/shared/lib/constants/modules"
import type { NavChild, NavGroup } from "@/src/shared/lib/types"

export type FinanceNavMatch = {
  group: NavGroup
  item: NavChild
}

/** The nav item a finance pathname belongs to — longest href wins, like the sidebar. */
export function matchFinanceNav(pathname: string): FinanceNavMatch | null {
  let best: FinanceNavMatch | null = null
  let bestLength = 0

  for (const group of FINANCE_NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.href || !pathnameMatches(pathname, item.href)) continue
      if (item.href.length > bestLength) {
        best = { group, item }
        bestLength = item.href.length
      }
    }
  }

  // Every finance path starts with the home href; only `/finance` itself is home.
  if (best?.item.href === FINANCE_HOME_ROUTE && pathname !== FINANCE_HOME_ROUTE) return null
  return best
}
