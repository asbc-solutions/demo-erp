'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Command,
  DollarSign,
  FileWarning,
  Plus,
  ScanSearch,
  UserRound,
  HelpCircle,
  SearchCheck,
  Moon,
  Search,
  Sun,
  ShieldAlert,
  Hourglass,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { SidebarTrigger } from '@/src/shared/components/ui/sidebar'
import { useLayoutHeaderTabLabel } from '@/src/shared/components/layout-header-context'
import { cn } from '@/src/shared/lib/utils/utils'
import { useUnreadNotifications } from '@/src/features/core-hr/lib/queries/notifications'
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '@/src/features/core-hr/lib/mutations/notifications'
import type { NotificationType } from '@/src/features/core-hr/lib/types'

const AREA_TITLE_BY_ROUTE: Record<string, string> = {
  'command-center': 'Command Center',
  finance: 'Finance',
  hr: 'HR & People',
  sales: 'Sales',
  operations: 'Operations',
  compliance: 'Compliance',
  integrations: 'Integrations',
  settings: 'Settings',
}

const PAGE_TITLE_BY_ROUTE: Record<string, string> = {
  '/sales': 'Sales · Dashboard',
  '/sales/customers': 'Sales · Customers',
  '/sales/quotations': 'Sales · Quotations',
  '/sales/sales-orders': 'Sales · Sales Orders',
  '/sales/invoices': 'Sales · Invoices',
  '/sales/reports': 'Sales · Reports',
  '/sales/settings': 'Sales · Settings',
}

type LayoutHeaderProps = Readonly<{
  /** When set, replaces the automatic route + tab title. */
  title?: string
}>

type QuickActionItem = Readonly<{
  label: string
  icon: LucideIcon
  shortcut?: string
}>

function useHeaderClock() {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    if (!mounted) return
    const id = globalThis.setInterval(() => setNow(new Date()), 1000)
    return () => globalThis.clearInterval(id)
  }, [mounted])

  const date =
    mounted &&
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(now)

  const time =
    mounted &&
    now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  return { mounted, date: date || '—', time: time || '—' }
}

function getNotificationMeta(type: NotificationType): {
  icon: LucideIcon
  tone: string
} {
  switch (type) {
    case 'contract_expiry':
      return { icon: FileWarning, tone: 'text-brand-warning' }
    case 'document_expiry':
      return { icon: FileWarning, tone: 'text-brand-warning' }
    case 'probation_reminder':
      return { icon: Hourglass, tone: 'text-brand-primary' }
    case 'overdue_task':
      return { icon: AlertTriangle, tone: 'text-brand-danger' }
    case 'headcount_discrepancy':
      return { icon: UserRound, tone: 'text-brand-warning' }
    case 'budget_overage':
      return { icon: ShieldAlert, tone: 'text-brand-danger' }
    case 'approval_required':
      return { icon: CheckCircle2, tone: 'text-brand-primary' }
    case 'approval_decision':
      return { icon: CheckCircle2, tone: 'text-brand-success' }
    default:
      return { icon: Bell, tone: 'text-content-tertiary' }
  }
}

function formatNotificationTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const LayoutHeader = ({ title: titleOverride }: LayoutHeaderProps) => {
  const pathname = usePathname()
  const tabLabel = useLayoutHeaderTabLabel(pathname)
  const { date, time } = useHeaderClock()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const segment = pathname.split('/').find(Boolean) ?? ''
  const areaTitle = AREA_TITLE_BY_ROUTE[segment] ?? 'Workspace'
  const title =
    titleOverride ??
    (tabLabel
      ? `${areaTitle} · ${tabLabel}`
      : (PAGE_TITLE_BY_ROUTE[pathname] ?? areaTitle))

  const isDark = mounted && resolvedTheme === 'dark'
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [notificationOpen, setNotificationOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLDivElement | null>(null)
  const notificationRef = React.useRef<HTMLDivElement | null>(null)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  React.useEffect(() => {
    if (!searchOpen && !notificationOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [searchOpen, notificationOpen])

  const { data: notificationsData, isLoading: notificationsLoading } =
    useUnreadNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  const notifications = notificationsData?.data ?? []
  const unreadCount = notificationsData?.meta?.total ?? 0

  const quickActions: readonly QuickActionItem[] = [
    { label: 'Create new invoice', icon: Plus, shortcut: '⌘N' },
    { label: 'Add new contact', icon: UserRound },
    { label: 'Export Q2 report', icon: SearchCheck },
  ]

  const navigationActions = [
    { label: 'Go to Command Center', icon: ScanSearch },
    { label: 'Go to Finance', icon: DollarSign },
  ] as const

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-stroke-default bg-surface-page px-4 md:px-6">
      {/* Left: mobile nav trigger + title + date/time */}
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
        <SidebarTrigger
          aria-label="Open navigation"
          className="-ml-1 size-9 shrink-0 rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary md:hidden"
        />
        <h1 className="font-heading min-w-0 truncate text-base font-semibold leading-6 text-content-primary md:text-[20px] md:leading-7">
          {title}
        </h1>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1.5 text-content-tertiary">
            <Calendar className="size-3.5" strokeWidth={1.75} />
            <span className="font-mono text-xs leading-[18px]">{date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-content-tertiary">
            <Clock className="size-3.5" strokeWidth={1.75} />
            <span className="font-mono text-xs leading-[18px]">{time}</span>
          </div>
        </div>
      </div>

      {/* Right: search + actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
        <div ref={searchRef} className="relative">
          <Button
            variant="outline"
            aria-label="Open search"
            onClick={() => {
              setSearchOpen((prev) => !prev)
              setNotificationOpen(false)
            }}
            className="h-9 w-9 gap-2 rounded-xl border-stroke-default bg-surface-white px-0 text-content-tertiary lg:w-auto lg:px-3 hover:bg-surface-white hover:text-foreground"
          >
            <Search className="size-4" strokeWidth={1.75} />
            <span className="hidden text-xs font-normal lg:inline">
              Search...
            </span>
            <kbd className="ml-1 hidden items-center gap-1 rounded border border-stroke-default bg-surface-hover px-1.5 py-0.5 font-mono text-[11px] leading-[16.5px] text-content-quaternary lg:inline-flex">
              <Command className="size-3" strokeWidth={1.75} />K
            </kbd>
          </Button>

          {searchOpen && (
            <div className="fixed inset-x-4 top-16 z-50 overflow-hidden md:absolute md:inset-x-auto md:right-0 md:top-11 md:w-[min(620px,calc(100vw-3rem))] rounded-lg border border-stroke-default bg-surface-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <div className="flex items-center border-b border-stroke-default px-3 py-2.5 sm:px-4 sm:py-3">
                <Search className="mr-3 size-5 shrink-0 text-content-quaternary" strokeWidth={1.75} />
                <Input
                  autoFocus
                  placeholder="Search or type a command..."
                  className="h-8 min-w-0 border-none px-0 text-base shadow-none focus-visible:ring-0"
                />
                <kbd className="hidden rounded border border-stroke-default bg-surface-hover px-2 py-1 font-mono text-[11px] leading-[16.5px] text-content-quaternary sm:inline">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[min(360px,60svh)] overflow-y-auto p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-content-quaternary">
                  Quick Actions
                </p>
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-content-primary sm:text-base',
                        index === 0 ? 'bg-surface-hover' : 'hover:bg-surface-muted',
                      )}
                    >
                      <Icon className="size-4 text-brand-primary" strokeWidth={1.75} />
                      <span>{action.label}</span>
                      {action.shortcut ? (
                        <span className="ml-auto font-mono text-[11px] leading-[15.4px] text-content-quaternary">
                          {action.shortcut}
                        </span>
                      ) : null}
                    </button>
                  )
                })}

                <p className="px-2 py-1.5 text-xs font-medium text-content-quaternary">
                  Navigate
                </p>
                {navigationActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-content-primary hover:bg-surface-muted sm:text-base"
                  >
                    <action.icon className="size-4 text-content-tertiary" strokeWidth={1.75} />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
          title={isDark ? 'Switch to light mode (D)' : 'Switch to dark mode (D)'}
          onClick={toggleTheme}
          className="size-9 rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary"
        >
          {mounted && isDark ? (
            <Sun strokeWidth={1.75} />
          ) : (
            <Moon strokeWidth={1.75} />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Help"
          className="hidden size-9 sm:inline-flex rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary"
        >
          <HelpCircle strokeWidth={1.75} />
        </Button>

        <div ref={notificationRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => {
              setNotificationOpen((prev) => !prev)
              setSearchOpen(false)
            }}
            className="relative size-9 rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary"
          >
            <Bell strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-danger"
              />
            )}
          </Button>

          {notificationOpen && (
            <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-stroke-default bg-surface-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between border-b border-stroke-default px-4 py-3">
                <p className="text-sm font-medium text-content-primary">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-brand-danger px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="text-[11px] leading-[15.4px] text-brand-primary hover:opacity-80"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notificationsLoading ? (
                <div className="space-y-0">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-stroke-default px-4 py-3">
                      <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded-full bg-surface-hover" />
                      <div className="flex flex-1 flex-col gap-1.5">
                        <div className="h-3 w-full animate-pulse rounded bg-surface-hover" />
                        <div className="h-2.5 w-16 animate-pulse rounded bg-surface-hover" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-content-quaternary">
                  No unread notifications
                </div>
              ) : (
                notifications.map((item, index) => {
                  const { icon: Icon, tone } = getNotificationMeta(item.type)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markRead(item.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left',
                        index !== notifications.length - 1 && 'border-b border-stroke-default',
                        'hover:bg-surface-muted',
                      )}
                    >
                      <Icon className={cn('mt-0.5 size-4 shrink-0', tone)} strokeWidth={1.75} />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-xs leading-[18px] text-content-primary">{item.title}</span>
                        <span className="text-[11px] leading-[15.4px] text-content-quaternary">
                          {formatNotificationTime(item.created_at)}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}

              <div className="border-t border-stroke-default px-4 py-2">
                <button
                  type="button"
                  className="w-full text-center text-[11px] leading-[15.4px] text-brand-primary hover:opacity-80"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle indigo gradient under-line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent"
      />
    </header>
  )
}

export default LayoutHeader
