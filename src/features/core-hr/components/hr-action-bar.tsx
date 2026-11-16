"use client"

import { Download, Plus, Search, SlidersHorizontal } from "lucide-react"

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
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          className="rounded-[10px]"
          onClick={onAddEmployee}
        >
          <Plus />
          Add Employee
        </Button>
        <Button
          variant="secondary"
          className="rounded-[10px]"
          onClick={onExport}
        >
          <Download />
          Export
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
            placeholder="Search by name, email, or employee number..."
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
            Filters
          </Button>
        )}
      </div>
    </div>
  )
}
