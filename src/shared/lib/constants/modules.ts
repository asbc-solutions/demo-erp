import {
  BadgeDollarSign,
  BarChart3,
  CalendarRange,
  Clock,
  DollarSign,
  FileText,
  Flag,
  FolderKanban,
  Folders,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  ListChecks,
  MessageSquare,
  Network,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { NavChild, NavItem } from '@/src/shared/lib/types'
import { HR_NAV } from './hr-nav'

/**
 * The app's module registry. This file owns two things that used to live inside
 * `layout-side-bar.tsx`:
 *
 *  1. `NAV_ITEMS` — the sidebar tree, still the only place a route is declared.
 *  2. The pathname → module resolution helpers built on top of it.
 *
 * Marketing tracking needs (2) to attribute a page view to a module, and it must
 * agree with the sidebar exactly — notably for Project Manager, whose 16 routes
 * carry no `/project-manager` URL prefix and are only recognisable via this tree.
 */

export const NAV_ITEMS: NavItem[] = [
  { id: 'command-center', label: 'Command Center', icon: LayoutGrid },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  {
    id: 'hr',
    label: 'HR & People',
    icon: Users,
    children: [...HR_NAV],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    children: [
      {
        id: 'sales-dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/sales',
      },
      {
        id: 'sales-customers',
        label: 'Customers',
        icon: UsersRound,
        href: '/sales/customers',
      },
      {
        id: 'sales-products',
        label: 'Products',
        icon: Package,
        href: '/sales/products',
      },
      {
        id: 'sales-quotations',
        label: 'Quotations',
        icon: FileText,
        href: '/sales/quotations',
      },
      {
        id: 'sales-orders',
        label: 'Sales Orders',
        icon: ShoppingCart,
        href: '/sales/sales-orders',
      },
      {
        id: 'sales-invoices',
        label: 'Invoices',
        icon: ReceiptText,
        href: '/sales/invoices',
      },
      {
        id: 'sales-reports',
        label: 'Reports',
        icon: BarChart3,
        href: '/sales/reports',
      },
      {
        id: 'sales-settings',
        label: 'Settings',
        icon: Settings,
        href: '/sales/settings',
      },
    ],
  },
   {
    id: 'project-manager',
    label: 'Project Manger',
    icon: FolderKanban,
    groups: [
      {
        id: 'pm',
        label: 'PM — Project Management',
        items: [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/over-view' },
          { id: 'my-projects', label: 'My Projects', icon: FolderKanban, href: '/my-project' },
          { id: 'all-projects', label: 'All Projects', icon: Folders , href: '/all-project' },
        ],
      },
      {
        id: 'planning',
        label: 'Planning',
        items: [
          { id: 'wbs', label: 'Work Breakdown (WBS)', icon: Network, href: '/WBS' },
          { id: 'scheduling', label: 'Scheduling & Gantt', icon: CalendarRange, href: '/schedule' },
          { id: 'resource-planner', label: 'Resource Planner', icon: UsersRound, href: '/resource-planner' },
        ],
      },
      {
        id: 'financials',
        label: 'Financials',
        items: [
          { id: 'budget-costs', label: 'Budget & Costs', icon: Wallet, href: '/budget-costs' },
          { id: 'billing-revenue', label: 'Billing & Revenue', icon: BadgeDollarSign, href: '/billing-revenue' },
        ],
      },
      {
        id: 'execution',
        label: 'Execution',
        items: [
          { id: 'tasks-assignments', label: 'Tasks & Assignments', icon: ListChecks, href: '/tasks-assignments' },
          { id: 'time-expense', label: 'Time & Expense', icon: Clock, href: '/time-expense' },
        ],
      },
      {
        id: 'collaboration',
        label: 'Collaboration',
        items: [
          { id: 'documents', label: 'Documents', icon: FileText, href: '/documents' },
          { id: 'team-chat', label: 'Team Chat', icon: MessageSquare, href: '/team-chat' },
        ],
      },
      {
        id: 'control',
        label: 'Control',
        items: [
          { id: 'phase-gate', label: 'Phase & Gate Control', icon: Flag, href: '/phase-gate' },
          { id: 'inventory-materials', label: 'Inventory & Materials', icon: Package, href: '/inventory-materials' },
          { id: 'reports-analytics', label: 'Reports & Analytics', icon: BarChart3, href: '/reports-analytics' },
        ],
      },
    ],
  },
  { id: 'operations', label: 'Operations', icon: Package },
  { id: 'compliance', label: 'Compliance', icon: FileText },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
 
]

export function getNavDescendants(item: NavItem): NavChild[] {
  return [
    ...(item.children ?? []),
    ...(item.groups?.flatMap((group) => group.items) ?? []),
  ]
}

export function getNavPath(child: NavChild): string | null {
  return child.href || null
}

export function pathnameMatches(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function getRouteParentId(pathname: string): string | null {
  let bestMatch: { parentId: string; pathLength: number } | null = null

  for (const item of NAV_ITEMS) {
    for (const child of getNavDescendants(item)) {
      const path = getNavPath(child)
      if (!path || !pathnameMatches(pathname, path)) continue
      if (!bestMatch || path.length > bestMatch.pathLength) {
        bestMatch = { parentId: item.id, pathLength: path.length }
      }
    }
  }

  return bestMatch?.parentId ?? null
}

export function getActiveChildId(parent: NavItem, pathname: string): string | null {
  let bestMatch: { childId: string; pathLength: number } | null = null

  for (const child of getNavDescendants(parent)) {
    const path = getNavPath(child)
    if (!path || !pathnameMatches(pathname, path)) continue
    if (!bestMatch || path.length > bestMatch.pathLength) {
      bestMatch = { childId: child.id, pathLength: path.length }
    }
  }

  return bestMatch?.childId ?? null
}

/* -------------------------------------------------------------------------- */
/*                           Tracked module registry                          */
/* -------------------------------------------------------------------------- */

export type ModuleId =
  | 'command-center'
  | 'finance'
  | 'hr'
  | 'sales'
  | 'project-manager'
  | 'operations'
  | 'compliance'
  | 'integrations'
  | 'settings'

export type TrackedModule = {
  id: ModuleId
  label: string
  icon: LucideIcon
  /** Token suffix used for charts and accents: `var(--brand-<accent>)`. */
  accent: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

/**
 * Every module a visitor can explore, in sidebar order. `settings` is included
 * even though it is not in `NAV_ITEMS` — it is reached from the sidebar footer.
 */
export const TRACKED_MODULES: readonly TrackedModule[] = [
  { id: 'command-center', label: 'Command Center', icon: LayoutGrid, accent: 'primary' },
  { id: 'finance', label: 'Finance', icon: DollarSign, accent: 'success' },
  { id: 'hr', label: 'HR & People', icon: Users, accent: 'info' },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, accent: 'warning' },
  { id: 'project-manager', label: 'Project Manager', icon: FolderKanban, accent: 'primary' },
  { id: 'operations', label: 'Operations', icon: Package, accent: 'danger' },
  { id: 'compliance', label: 'Compliance', icon: FileText, accent: 'info' },
  { id: 'integrations', label: 'Integrations', icon: Link2, accent: 'success' },
  { id: 'settings', label: 'Settings', icon: Settings, accent: 'warning' },
]

export const MODULE_IDS: readonly ModuleId[] = TRACKED_MODULES.map((m) => m.id)

const MODULE_LABEL_BY_ID = new Map<ModuleId, string>(
  TRACKED_MODULES.map((m) => [m.id, m.label]),
)

export function getModuleLabel(id: ModuleId): string {
  return MODULE_LABEL_BY_ID.get(id) ?? id
}

/** Routes that belong to a module but are not reachable from `NAV_ITEMS`. */
const EXTRA_MODULE_ROUTES: ReadonlyArray<{ id: ModuleId; path: string }> = [
  { id: 'settings', path: '/settings' },
]

/**
 * Resolve the module a pathname belongs to, mirroring the sidebar's own
 * active-item rule (`layout-side-bar.tsx`): a top-level item matches on
 * `/{id}`, otherwise the deepest matching descendant `href` wins.
 *
 * Returns `null` for routes outside the app shell (`/`, `/markting-traking`).
 */
export function resolveModuleFromPath(pathname: string): ModuleId | null {
  const fromDescendant = getRouteParentId(pathname)
  if (fromDescendant) return fromDescendant as ModuleId

  for (const item of NAV_ITEMS) {
    if (pathnameMatches(pathname, `/${item.id}`)) return item.id as ModuleId
  }

  for (const extra of EXTRA_MODULE_ROUTES) {
    if (pathnameMatches(pathname, extra.path)) return extra.id
  }

  return null
}
