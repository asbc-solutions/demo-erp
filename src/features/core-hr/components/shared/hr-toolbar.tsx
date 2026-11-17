"use client"

import * as React from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { Input } from "@/src/shared/components/ui/input"
import {
  HrFilterPanel,
  type HrFilterGroup,
  type HrFilterValues,
} from "./hr-filter-panel"

type HrToolbarProps = Readonly<{
  primary?: React.ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onOpenFilters?: () => void
  showSearch?: boolean
  showFilters?: boolean
  /** When provided, the Filters button opens a checkbox filter popover. */
  filterGroups?: readonly HrFilterGroup[]
  filterValues?: HrFilterValues
  onFilterChange?: (next: HrFilterValues) => void
}>

export function HrToolbar({
  primary,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onOpenFilters,
  showSearch = true,
  showFilters = true,
  filterGroups,
  filterValues,
  onFilterChange,
}: HrToolbarProps) {
  const t = useTranslations("HrShared")
  const tCommon = useTranslations("Common")

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">{primary}</div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {showSearch && (
          <div className="relative w-full max-w-[360px]">
            <Search
              aria-hidden
              className="text-content-quaternary pointer-events-none absolute top-1/2 inset-s-3 size-4 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <Input
              type="search"
              value={searchValue ?? ""}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder ?? t("searchEmployeesPlaceholder")}
              className="bg-surface-page h-10 rounded-[10px] border-transparent ps-9 shadow-none"
            />
          </div>
        )}
        {showFilters &&
          (filterGroups && onFilterChange ? (
            <HrFilterPanel
              groups={filterGroups}
              values={filterValues ?? {}}
              onChange={onFilterChange}
            />
          ) : (
            <Button
              variant="secondary"
              className="rounded-[10px]"
              onClick={onOpenFilters}
            >
              <SlidersHorizontal />
              {tCommon("filters")}
            </Button>
          ))}
      </div>
    </div>
  )
}
