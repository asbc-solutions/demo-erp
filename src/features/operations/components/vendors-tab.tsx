"use client"

import { useMemo, useState } from "react"
import { Clock, DollarSign, Search, Store } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  VENDOR_FILTER_OPTIONS,
  VENDOR_KPI_TILES,
  type VendorKpiAccent,
  type VendorKpiTile,
} from "../data/operations-mock"
import { useVendorKpis, useVendors } from "../lib/queries/vendors"
import type { VendorListItem, VendorStatus } from "../lib/types"
import { formatCurrencyAmount } from "../lib/utils/format"

import { OperationsErrorState } from "./shared/operations-error-state"
import { OperationsPageSpinner } from "./shared/operations-loading"
import { RenewVendorDialog } from "./renew-vendor-dialog"
import { VendorCard } from "./vendor-card"

const accentTile: Record<VendorKpiAccent, string> = {
  emerald: "bg-brand-success/10 text-brand-success",
  indigo: "bg-brand-primary/10 text-brand-primary",
  amber: "bg-brand-warning/10 text-brand-warning",
}

const iconMap = {
  vendors: Store,
  dollar: DollarSign,
  clock: Clock,
} as const

function VendorKpiCard({ tile, value }: { tile: VendorKpiTile; value: number }) {
  const Icon = iconMap[tile.icon]
  const display =
    tile.format === "currency" ? formatCurrencyAmount(value) : value.toLocaleString("en-US")
  return (
    <Card variant="elevated" className="flex-row items-center gap-4 p-5">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          accentTile[tile.accent],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-content-tertiary text-[11px] leading-[15.4px]">
          {tile.label}
        </span>
        <span className="text-content-primary text-[25px] leading-[32.5px] font-semibold">
          {display}
        </span>
      </div>
    </Card>
  )
}

export function VendorsTab() {
  const [filter, setFilter] = useState<VendorStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [renewTarget, setRenewTarget] = useState<VendorListItem | null>(null)

  const vendorsQuery = useVendors({ per_page: 100 })
  const kpisQuery = useVendorKpis()

  const allVendors = useMemo(() => vendorsQuery.data?.data ?? [], [vendorsQuery.data])
  const kpis = kpisQuery.data

  const vendors = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    return allVendors.filter((vendor) => {
      if (filter !== "all" && vendor.status !== filter) return false
      if (!trimmed) return true
      return (
        vendor.name.toLowerCase().includes(trimmed) ||
        vendor.category.toLowerCase().includes(trimmed) ||
        (vendor.contact_email ?? "").toLowerCase().includes(trimmed)
      )
    })
  }, [allVendors, filter, query])

  const isLoading = vendorsQuery.isLoading || kpisQuery.isLoading
  const isError = vendorsQuery.isError || kpisQuery.isError

  if (isLoading) {
    return <OperationsPageSpinner />
  }

  if (isError) {
    return (
      <OperationsErrorState
        message="Failed to load vendors."
        onRetry={() => {
          void vendorsQuery.refetch()
          void kpisQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VENDOR_KPI_TILES.map((tile) => (
          <VendorKpiCard key={tile.key} tile={tile} value={kpis?.[tile.key] ?? 0} />
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {VENDOR_FILTER_OPTIONS.map((option) => {
            const isActive = filter === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "inline-flex h-8 items-center rounded-lg border px-2.5 text-[11px] leading-[15.4px] font-medium transition-colors",
                  isActive
                    ? "border-transparent bg-brand-primary text-white"
                    : "border-stroke-default bg-surface-white text-content-secondary hover:text-content-primary",
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <div className="relative w-[280px]">
          <Search
            className="text-content-tertiary absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vendors..."
            className="h-9 pl-9 text-[13px]"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.length === 0 ? (
          <div className="border-stroke-default bg-surface-white text-content-tertiary col-span-full flex h-24 items-center justify-center rounded-2xl border border-dashed text-[12px] leading-[18px]">
            No vendors match the current filters.
          </div>
        ) : (
          vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onRenewClick={setRenewTarget} />
          ))
        )}
      </section>

      <RenewVendorDialog
        key={renewTarget?.id ?? "none"}
        vendor={renewTarget}
        onOpenChange={(open) => {
          if (!open) setRenewTarget(null)
        }}
      />
    </div>
  )
}
