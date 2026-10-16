'use client'

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  LogOut,
  Settings,
  UserRoundCog,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { cn } from '@/src/shared/lib/utils/utils'
import { Button } from '@/src/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/shared/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/src/shared/components/ui/sidebar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/src/shared/components/ui/accordion'
import { useEffect, useState } from 'react'
import { NavChild, NavItem } from '../lib/types'
import {
  NAV_ITEMS,
  getActiveChildId,
  getRouteParentId,
  pathnameMatches,
} from '../lib/constants/modules'
// import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCustomers } from '@/src/features/sales/lib/queries/customers'
import { useQuotations } from '@/src/features/sales/lib/queries/quotations'
import { useOrders } from '@/src/features/sales/lib/queries/orders'
import { useInvoices } from '@/src/features/sales/lib/queries/invoices'
import { useFinanceNavCounts } from '@/src/features/finance/lib/queries/shell'



/** Nav badge counts are decorative — refetching them every minute is wasted traffic. */
const BADGE_STALE_TIME_MS = 5 * 60 * 1000

const badgeQuery = (enabled: boolean) => ({ enabled, staleTime: BADGE_STALE_TIME_MS })

function SidebarBrand() {
  return (
    <div className="flex h-14 items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500"
      >
        <span className="font-heading text-xs font-bold leading-[18px] text-white">
          N
        </span>
      </div>
      <span className="font-heading text-base font-semibold leading-6 text-content-primary group-data-[collapsible=icon]:hidden">
        ASBC
      </span>
    </div>
  )
}

function NavMenu({
  collapsed,
  onOpenSubmenu,
  badgeOverrides,
}: Readonly<{
  collapsed: boolean
  onOpenSubmenu: (id: string) => void
  badgeOverrides?: Record<string, number | undefined>
}>) {

  const router = useRouter()
  const pathname = usePathname()
  const handleClick = (item: NavItem) => {
    if (item.children?.length || item.groups?.length) {
      onOpenSubmenu(item.id)
      return
    }
    router.push(`/${item.id}`)
  }
  return (
    <SidebarMenu
      className={cn(
        'gap-1 duration-200 animate-in fade-in slide-in-from-left-4',
        collapsed && 'items-center justify-center',
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathnameMatches(pathname, `/${item.id}`) ||
          getRouteParentId(pathname) === item.id
        const Icon = item.icon
        const badge = badgeOverrides?.[item.id] ?? item.badge

        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={isActive}
              onClick={() => handleClick(item)}
              className={cn(
                'h-10 rounded-xl px-3 text-sm font-medium text-content-tertiary',
                'hover:bg-surface-hover/60 hover:text-content-primary',
                'data-active:bg-surface-hover data-active:text-content-primary',
                isActive && '[&>svg]:text-brand-primary',
              )}
            >
              {/* <Link href={`/${item.id}`}> */}
                <Icon strokeWidth={1.75} />
                <span>{item.label}</span>
              {/* </Link> */}
              {item.children?.length || item.groups?.length ? (
                <ChevronRight
                  className="ml-auto size-4 shrink-0 text-content-tertiary group-data-[collapsible=icon]:hidden"
                  strokeWidth={1.75}
                />
              ) : null}
            </SidebarMenuButton>

            {badge !== undefined && (
              <SidebarMenuBadge className="h-5 -translate-y-1/2 rounded-full bg-brand-primary px-1.5 text-[11px] font-medium text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white peer-data-[size=default]/menu-button:top-1/2 peer-data-[size=lg]/menu-button:top-1/2 peer-data-[size=sm]/menu-button:top-1/2">
                {badge}
              </SidebarMenuBadge>
            )}

            {isActive && (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-brand-primary shadow-[0_0_8px_0_rgba(99,102,241,0.5)] group-data-[collapsible=icon]:hidden"
              />
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

function NavCountBadge({ count, active }: Readonly<{ count: number; active: boolean }>) {
  return (
    <span
      className={cn(
        'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none group-data-[collapsible=icon]:hidden',
        active ? 'bg-brand-primary text-white' : 'bg-stroke-default text-content-tertiary',
      )}
    >
      {count}
    </span>
  )
}

function ActiveItemBar() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-brand-primary shadow-[0_0_8px_0_rgba(99,102,241,0.5)] group-data-[collapsible=icon]:hidden"
    />
  )
}

function SubMenuBackButton({
  label,
  collapsed,
  onBack,
}: Readonly<{ label: string; collapsed: boolean; onBack: () => void }>) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        'mb-2 flex h-10 w-full shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-content-primary',
        'hover:bg-surface-hover/60',
        collapsed && 'justify-center px-0',
      )}
    >
      <ChevronLeft className="size-4 shrink-0 text-content-tertiary" strokeWidth={1.75} />
      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
    </button>
  )
}

/**
 * Submenu whose groups collapse (Finance). The group holding the active route
 * opens on navigation; other groups keep whatever the user toggled. Open state
 * is keyed by pathname like the submenu selection below, so no effect is needed.
 * In the icon rail each group becomes one icon that opens its first item.
 */
function CollapsibleNavSubMenu({
  parent,
  collapsed,
  onBack,
  badgeOverrides,
}: Readonly<{
  parent: NavItem
  collapsed: boolean
  onBack: () => void
  badgeOverrides?: Record<string, number | undefined>
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const groups = parent.groups ?? []
  const activeChildId = getActiveChildId(parent, pathname)
  const activeGroupId =
    groups.find((group) => group.items.some((item) => item.id === activeChildId))?.id ?? null

  const [openGroups, setOpenGroups] = useState(() => ({
    pathname,
    ids: activeGroupId ? [activeGroupId] : [],
  }))
  const openIds =
    openGroups.pathname === pathname || !activeGroupId || openGroups.ids.includes(activeGroupId)
      ? openGroups.ids
      : [...openGroups.ids, activeGroupId]

  return (
    <div className="flex h-full min-h-0 flex-col duration-200 animate-in fade-in slide-in-from-right-4">
      <SubMenuBackButton label={parent.label} collapsed={collapsed} onBack={onBack} />

      <div className="thin-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        {collapsed ? (
          <SidebarMenu className="items-center justify-center gap-1">
            {groups.map((group) => {
              const Icon = group.icon ?? parent.icon
              const first = group.items.find((item) => item.href)
              return (
                <SidebarMenuItem key={group.id}>
                  <SidebarMenuButton
                    tooltip={group.label}
                    isActive={group.id === activeGroupId}
                    onClick={() => first?.href && router.push(first.href)}
                    className={cn(
                      'h-10 rounded-xl px-3 text-content-tertiary',
                      'hover:bg-surface-hover/60 hover:text-content-primary',
                      'data-active:bg-brand-primary/10 data-active:text-brand-primary',
                    )}
                  >
                    <Icon strokeWidth={1.75} />
                    <span>{group.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        ) : (
          <Accordion
            type="multiple"
            value={openIds}
            onValueChange={(ids) => setOpenGroups({ pathname, ids })}
            className="flex flex-col gap-0.5"
          >
            {groups.map((group) => {
              const Icon = group.icon
              return (
                <AccordionItem key={group.id} value={group.id} className="border-b-0">
                  <AccordionTrigger
                    hideChevron
                    className={cn(
                      'group/nav-group h-9 gap-2 rounded-lg px-2 py-0 text-[13px] font-medium text-content-secondary',
                      'hover:bg-surface-hover/60 hover:text-content-primary',
                      group.id === activeGroupId && 'text-content-primary',
                    )}
                  >
                    <ChevronRight
                      aria-hidden
                      className="size-3.5 shrink-0 text-content-quaternary transition-transform duration-200 group-data-[state=open]/nav-group:rotate-90"
                    />
                    {Icon ? (
                      <Icon aria-hidden className="size-4 shrink-0 text-content-tertiary" strokeWidth={1.75} />
                    ) : null}
                    <span className="flex-1 truncate">{group.label}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0.5 pb-1">
                    <SidebarMenu className="gap-0.5">
                      {group.items.map((child) => {
                        const isActive = child.id === activeChildId
                        const badge = badgeOverrides?.[child.id] ?? child.badge
                        return (
                          <SidebarMenuItem key={child.id}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => child.href && router.push(child.href)}
                              className={cn(
                                'h-8 rounded-lg pr-2 pl-10 text-[13px] font-normal text-content-tertiary',
                                'hover:bg-surface-hover/60 hover:text-content-primary',
                                'data-active:bg-brand-primary/10 data-active:font-medium data-active:text-content-primary',
                              )}
                            >
                              <span className="truncate">{child.label}</span>
                              {badge !== undefined ? (
                                <NavCountBadge count={badge} active={isActive} />
                              ) : null}
                            </SidebarMenuButton>
                            {isActive ? <ActiveItemBar /> : null}
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}

function NavSubMenu({
  parent,
  collapsed,
  onBack,
  badgeOverrides,
}: Readonly<{
  parent: NavItem
  collapsed: boolean
  onBack: () => void
  badgeOverrides?: Record<string, number | undefined>
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const children = parent.children ?? []
  const groups = parent.groups ?? []
  const activeChildId = getActiveChildId(parent, pathname)

  const handleClick = (child: NavChild) => {
    if (child.href) router.push(child.href)
  }

  if (parent.collapsibleGroups) {
    return (
      <CollapsibleNavSubMenu
        parent={parent}
        collapsed={collapsed}
        onBack={onBack}
        badgeOverrides={badgeOverrides}
      />
    )
  }

  const renderChild = (child: NavChild) => {
    const Icon = child.icon
    const isActive = child.id === activeChildId
    const badge = badgeOverrides?.[child.id] ?? child.badge
    return (
      <SidebarMenuItem key={child.id}>
        <SidebarMenuButton
          tooltip={child.label}
          isActive={isActive}
          onClick={() => handleClick(child)}
          className={cn(
            'h-10 rounded-xl px-3 text-sm font-medium text-content-tertiary',
            'hover:bg-surface-hover/60 hover:text-content-primary',
            'data-active:bg-brand-primary/10',
            isActive && 'text-brand-primary [&>svg]:text-brand-primary',
          )}
        >
          {Icon ? (
            <Icon strokeWidth={1.75} />
          ) : (
            <span aria-hidden className="size-4 shrink-0" />
          )}
          <span>{child.label}</span>
          {badge !== undefined ? <NavCountBadge count={badge} active={isActive} /> : null}
        </SidebarMenuButton>
        {isActive ? <ActiveItemBar /> : null}
      </SidebarMenuItem>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col duration-200 animate-in fade-in slide-in-from-right-4">
      <SubMenuBackButton label={parent.label} collapsed={collapsed} onBack={onBack} />

      <div
        className={cn(
          'thin-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto',
          collapsed && 'items-center',
        )}
      >
        {groups.length ? (
          groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1">
              <span className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wide text-content-quaternary group-data-[collapsible=icon]:hidden">
                {group.label}
              </span>
              <SidebarMenu className={cn('gap-1', collapsed && 'items-center justify-center')}>
                {group.items.map((child) => renderChild(child))}
              </SidebarMenu>
            </div>
          ))
        ) : (
          <SidebarMenu className={cn('gap-1', collapsed && 'items-center justify-center')}>
            {children.map((child) => renderChild(child))}
          </SidebarMenu>
        )}
      </div>
    </div>
  )
}

function UserProfileButton() {
  const { data: session } = useSession()

  const name = session?.user?.name ?? '—'
  const email = session?.user?.email ?? ''
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-12 w-full justify-start gap-3 rounded-xl px-3 py-2 text-left',
            'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500 text-xs font-normal leading-[18px] text-white">
            {initials}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
            <span className="flex min-w-0 flex-1 flex-col items-start">
              <span className="truncate text-sm font-medium leading-[18px] text-content-primary">
                {name}
              </span>
              <span className="truncate text-[11px] font-normal leading-[15.4px] text-content-tertiary">
                {email}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-content-tertiary" strokeWidth={1.75} />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        className="w-[220px] rounded-lg border-stroke-default bg-surface-white p-1.5"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-medium text-content-quaternary">
          My Account
        </DropdownMenuLabel>

        <DropdownMenuItem className="gap-4 rounded-md px-2 py-1.5 text-xs text-content-primary">
          <UserRoundCog className="size-4 text-content-tertiary" strokeWidth={1.75} />
          <span>Profile &amp; Setting</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-4 rounded-md px-2 py-1.5 text-xs text-content-primary">
          <Keyboard className="size-4 text-content-tertiary" strokeWidth={1.75} />
          <span>Keyboard Shortcut</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-4 rounded-md px-2 py-1.5 text-xs text-brand-danger"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="size-4 text-brand-danger" strokeWidth={1.75} />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarRailToggle() {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  // On mobile the sidebar is a sheet opened from the header trigger; there is no rail to collapse.
  if (isMobile) return null

  return (
    <Button
      variant="outline"
      size="icon-xs"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onClick={toggleSidebar}
      className={cn(
        'absolute -right-3 top-1/2 z-20 size-6 -translate-y-1/2 rounded-full',
        'border-stroke-default bg-surface-white text-content-tertiary shadow-sm',
        'hover:bg-surface-white hover:text-content-primary',
      )}
    >
      {collapsed ? <ChevronRight /> : <ChevronLeft />}
    </Button>
  )
}

const LayoutSideBar = () => {
  const pathname = usePathname()
  const routeParentId = getRouteParentId(pathname)
  const [submenuSelection, setSubmenuSelection] = useState(() => ({
    pathname,
    id: routeParentId,
  }))
  const openSubmenu =
    submenuSelection.pathname === pathname
      ? submenuSelection.id
      : routeParentId
  const router = useRouter()
  const { state, isMobile, setOpenMobile } = useSidebar()
  // The mobile sheet always shows the full-width nav, whatever the desktop rail state is.
  const collapsed = !isMobile && state === 'collapsed'

  // Close the mobile sheet once a nav item routes somewhere.
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const openParent =
    NAV_ITEMS.find((item) => item.id === openSubmenu) ?? null

  // The sidebar renders on every authenticated page, so these counts used to cost
  // five list requests per page load whose results were thrown away unless the
  // matching nav happened to be visible. Fetch each set only while the nav that
  // shows it is on screen, and treat the counts as decorative (long staleTime).
  const salesBadges = badgeQuery(openParent?.id === 'sales')

  const { data: customersData } = useCustomers({ per_page: 1 }, salesBadges)
  const { data: quotationsData } = useQuotations({ per_page: 1 }, salesBadges)
  const { data: ordersData } = useOrders({ per_page: 1 }, salesBadges)
  const { data: invoicesData } = useInvoices({ per_page: 1 }, salesBadges)
  const salesBadgeOverrides: Record<string, number | undefined> = {
    'sales-customers': customersData?.meta?.total,
    'sales-quotations': quotationsData?.meta?.total,
    'sales-orders': ordersData?.meta?.total,
    'sales-invoices': invoicesData?.meta?.total,
  }

  // One query feeds both the top-level Finance badge and the finance submenu badges.
  const { data: financeNavCounts } = useFinanceNavCounts(
    badgeQuery(!openParent || openParent.id === 'finance'),
  )
  const topLevelBadgeOverrides: Record<string, number | undefined> = {
    finance: financeNavCounts?.total,
  }
  const submenuBadgeOverrides =
    openParent?.id === 'sales'
      ? salesBadgeOverrides
      : openParent?.id === 'finance'
        ? financeNavCounts?.counts
        : undefined

  return (
    <Sidebar
      collapsible="icon"
      className="border-stroke-light bg-surface-white"
    >
      <SidebarHeader className="h-14 border-b border-stroke-light p-0 px-4">
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup
          className={cn('overflow-x-clip p-0', openParent && 'min-h-0 flex-1')}
        >
          <SidebarGroupContent className={cn(openParent && 'flex h-full min-h-0 flex-col')}>
            {openParent ? (
              <NavSubMenu
                parent={openParent}
                collapsed={collapsed}
                onBack={() => setSubmenuSelection({ pathname, id: null })}
                badgeOverrides={submenuBadgeOverrides}
              />
            ) : (
              <NavMenu
                onOpenSubmenu={(id) =>
                  setSubmenuSelection({ pathname, id })
                }
                collapsed={collapsed}
                badgeOverrides={topLevelBadgeOverrides}
              />
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-stroke-light items-center justify-center gap-2 px-2 pb-2 pt-2.5">
        <SidebarMenu className={cn("gap-0", collapsed && "items-center justify-center")}>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => router.push('/settings')}
              className={cn(
                'h-10 rounded-xl px-3 text-sm font-medium text-content-tertiary',
                'hover:bg-surface-hover/60 hover:text-content-primary',
              )}
            >
              <Settings strokeWidth={1.75} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <UserProfileButton />
      </SidebarFooter>

      <SidebarRailToggle />
    </Sidebar>
  )
}

export default LayoutSideBar
