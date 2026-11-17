"use client"

import { Download, Plus, Search, SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { Input } from "@/src/shared/components/ui/input"
import {
  HrFilterPanel,
  type HrFilterGroup,
  type HrFilterValues,
} from "./shared/hr-filter-panel"

type HrActionBarProps = Readonly<{
  onAddEmployee?: () => void
  onExport?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  onOpenFilters?: () => void
  /** When provided, the Filters button opens a checkbox filter popover. */
  filterGroups?: readonly HrFilterGroup[]
  filterValues?: HrFilterValues
  onFilterChange?: (next: HrFilterValues) => void
}>

export function HrActionBar({
  onAddEmployee,
  onExport,
  searchValue,
  onSearchChange,
  onOpenFilters,
  filterGroups,
  filterValues,
  onFilterChange,
}: HrActionBarProps) {
  const t = useTranslations("HrEmployees")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          className="rounded-[10px]"
          onClick={onAddEmployee}
        >
          <Plus />
          {t("addEmployee")}
        </Button>
        <Button
          variant="secondary"
          className="rounded-[10px]"
          onClick={onExport}
        >
          <Download />
          {tCommon("export")}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
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
            placeholder={tShared("searchEmployeesPlaceholder")}
            className="bg-surface-page h-10 rounded-[10px] border-transparent ps-9 shadow-none"
          />
        </div>
        {filterGroups && onFilterChange ? (
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
        )}
      </div>
    </div>
  )
}
