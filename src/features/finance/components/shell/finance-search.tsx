"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { Input } from "@/src/shared/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/src/shared/components/ui/popover"
import { FINANCE_NAV_GROUPS } from "@/src/shared/lib/constants/finance-nav"
import { cn } from "@/src/shared/lib/utils/utils"

import { useFinanceSearch } from "../../lib/queries/shell"
import type { FinanceContact } from "../../lib/types/common"

const MIN_QUERY = 2
const SCREEN_LIMIT = 5

type SearchHit = { id: string; label: string; sub: string; href: string }

const SCREEN_ITEMS = FINANCE_NAV_GROUPS.flatMap((group) =>
  group.items
    .filter((item) => item.href)
    .map((item) => ({ group, item, href: item.href as string })),
)

function contactHref(contact: FinanceContact): string {
  return contact.kind === "supplier" ? `/finance/ap/${contact.id}` : `/finance/ar/${contact.id}`
}

function ResultGroup({
  title,
  hits,
  onSelect,
}: {
  title: string
  hits: SearchHit[]
  onSelect: (href: string) => void
}) {
  if (hits.length === 0) return null
  return (
    <div role="group" aria-label={title} className="flex flex-col py-1">
      <span className="text-content-quaternary px-2 py-1 text-[11px] leading-4 font-semibold tracking-[0.5px] uppercase">
        {title}
      </span>
      {hits.map((hit) => (
        <button
          key={hit.id}
          type="button"
          onClick={() => onSelect(hit.href)}
          className="hover:bg-surface-hover focus-visible:bg-surface-hover flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-start outline-none"
        >
          <span className="text-content-primary truncate text-sm leading-5">{hit.label}</span>
          <span className="text-content-tertiary shrink-0 text-xs leading-4">{hit.sub}</span>
        </button>
      ))}
    </div>
  )
}

/** Toolbar search across finance screens, contacts and accounts. */
function FinanceSearch({ className }: { className?: string }) {
  const t = useTranslations("FinanceShared")
  const tNav = useTranslations("Nav")
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const term = query.trim().toLowerCase()

  // "/" focuses search from anywhere in finance, unless the user is already typing.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])
  const active = term.length >= MIN_QUERY
  const { data, isFetching } = useFinanceSearch(active ? term : "")

  const screens: SearchHit[] = active
    ? SCREEN_ITEMS.map(({ group, item, href }) => ({
        id: item.id,
        label: tNav(item.labelKey),
        sub: tNav(group.labelKey),
        href,
      }))
        .filter((screen) => screen.label.toLowerCase().includes(term))
        .slice(0, SCREEN_LIMIT)
    : []
  const contacts: SearchHit[] = (data?.contacts ?? []).map((contact) => ({
    id: contact.id,
    label: contact.name,
    sub: t("searchContactSub", {
      kind: contact.kind === "supplier" ? t("searchSupplier") : t("searchCustomer"),
      code: contact.code,
    }),
    href: contactHref(contact),
  }))
  const accounts: SearchHit[] = (data?.accounts ?? []).map((account) => ({
    id: account.id,
    label: account.name,
    sub: account.code,
    href: `/finance/ledger?account=${account.code}`,
  }))
  const first = screens[0] ?? contacts[0] ?? accounts[0]
  const empty = active && !isFetching && !first

  const select = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Popover open={open && active} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div data-slot="finance-search" className={cn("relative", className)}>
          <Search
            aria-hidden
            className="text-content-quaternary pointer-events-none absolute top-1/2 inset-s-3 size-4 -translate-y-1/2"
          />
          <Input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={open && active}
            aria-label={t("searchAriaLabel")}
            aria-keyshortcuts="/"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false)
              if (event.key === "Enter" && first) select(first.href)
            }}
            className="h-9 ps-9"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-(--radix-popper-anchor-width) p-1"
      >
        <ResultGroup title={t("searchScreens")} hits={screens} onSelect={select} />
        <ResultGroup title={t("searchContacts")} hits={contacts} onSelect={select} />
        <ResultGroup title={t("searchAccounts")} hits={accounts} onSelect={select} />
        {empty ? (
          <p className="text-content-tertiary px-2 py-3 text-sm leading-5">
            {t("searchNoMatch", { query: query.trim() })}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { FinanceSearch }
