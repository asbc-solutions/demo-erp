import { LucideIcon } from "lucide-react"
import type { Messages } from "next-intl"

/** A key of the `Nav` message namespace; render it with `useTranslations("Nav")`. */
export type NavLabelKey = keyof Messages["Nav"]

export type NavChild = {
  id: string
  labelKey: NavLabelKey
  /** Target route to navigate to when clicked. Omit for not-yet-wired (dummy) items. */
  href?: string
  icon?: LucideIcon
  badge?: number
}

/** A labeled section of children shown inside a parent's submenu. */
export type NavGroup = {
  id: string
  labelKey: NavLabelKey
  items: NavChild[]
  /** Shown on the group header when groups are collapsible, and in the icon rail. */
  icon?: LucideIcon
}

export type NavItem = {
  id: string
  labelKey: NavLabelKey
  icon: LucideIcon
  badge?: number
  children?: NavChild[]
  /** Grouped children rendered as labeled sections in the submenu. */
  groups?: NavGroup[]
  /** Render `groups` as collapsible sections; the one holding the active route opens itself. */
  collapsibleGroups?: boolean
}
