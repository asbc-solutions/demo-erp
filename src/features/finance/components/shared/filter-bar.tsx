"use client"

import * as React from "react"
import { ChevronDown, Columns3, Funnel, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Input } from "@/src/shared/components/ui/input"
import { cn } from "@/src/shared/lib/utils/utils"

export type FilterOption = { value: string; label: string }

/** Grey strip above a list: search, filter chips, and the result count on the right. */
function FilterBar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-bar"
      role="toolbar"
      className={cn(
        "border-stroke-default bg-surface-hover flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2",
        className,
      )}
      {...props}
    />
  )
}

function FilterSearch({
  className,
  placeholder: placeholderProp,
  ...props
}: React.ComponentProps<"input">) {
  const t = useTranslations("FinanceShared")
  const placeholder = placeholderProp ?? t("searchPlaceholder")
  return (
    <div data-slot="filter-search" className={cn("relative w-64", className)}>
      <Search
        aria-hidden
        className="text-content-quaternary pointer-events-none absolute top-1/2 inset-s-2.5 size-3.5 -translate-y-1/2"
      />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        className="h-8 ps-8 text-[13px]"
        {...props}
      />
    </div>
  )
}

/** The decorative funnel that separates search from the chips. */
function FilterIcon() {
  return <Funnel aria-hidden className="text-content-tertiary size-3.5 shrink-0" />
}

type FilterChipProps = {
  label: string
  value: string
  options: FilterOption[]
  onValueChange: (value: string) => void
  /** Value that means "no filter"; its label reads as "all". */
  allValue?: string
  className?: string
}

/** A select that reads as `Status: all` and opens a single-choice menu. */
function FilterChip({
  label,
  value,
  options,
  onValueChange,
  allValue = "all",
  className,
}: FilterChipProps) {
  const t = useTranslations("FinanceShared")
  const tCommon = useTranslations("Common")
  const current =
    value === allValue ? t("filterAll") : (options.find((o) => o.value === value)?.label ?? value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-slot="filter-chip"
          className={cn(
            "border-stroke-input bg-surface-white text-content-primary hover:bg-surface-page flex h-8 items-center gap-2 rounded-md border px-3 text-[13px] leading-5 transition-colors",
            "focus-visible:ring-brand-primary/20 outline-none focus-visible:ring-[3px]",
            className,
          )}
        >
          <span>{t("filterChipLabel", { label, value: current })}</span>
          <ChevronDown aria-hidden className="text-content-tertiary size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem value={allValue}>{tCommon("all")}</DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "Group by  [No grouping ▾]" */
function GroupBySelect({
  value,
  options,
  onValueChange,
  className,
}: {
  value: string
  options: FilterOption[]
  onValueChange: (value: string) => void
  className?: string
}) {
  const t = useTranslations("FinanceShared")
  const current = options.find((o) => o.value === value)?.label ?? t("noGrouping")
  return (
    <div data-slot="group-by-select" className={cn("flex items-center gap-2", className)}>
      <span className="text-content-secondary text-[13px] leading-5">{t("groupBy")}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="text-content-primary text-[13px]">
            {current}
            <ChevronDown aria-hidden className="text-content-tertiary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** "Columns · 8/9" — toggles which hideable columns a table shows. */
function ColumnChooser({
  columns,
  hiddenIds,
  onHiddenIdsChange,
  className,
}: {
  columns: { id: string; label: string }[]
  hiddenIds: string[]
  onHiddenIdsChange: (ids: string[]) => void
  className?: string
}) {
  const t = useTranslations("FinanceShared")
  const visible = columns.length - hiddenIds.length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className={cn("text-content-primary", className)}>
          <Columns3 aria-hidden />
          {t("columnsCount", { visible, total: columns.length })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>{t("visibleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => {
          const checked = !hiddenIds.includes(column.id)
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={checked}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(next) =>
                onHiddenIdsChange(
                  next ? hiddenIds.filter((id) => id !== column.id) : [...hiddenIds, column.id],
                )
              }
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Right-aligned summary such as `314 entries · 2026-04`. */
function ResultCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="result-count"
      className={cn("text-content-tertiary ms-auto text-[13px] leading-5 whitespace-nowrap", className)}
      {...props}
    />
  )
}

/** Replaces the filter bar while rows are selected: count, bulk actions, clear. */
function SelectionBar({
  className,
  count,
  onClear,
  children,
  ...props
}: React.ComponentProps<"div"> & { count: number; onClear: () => void }) {
  const t = useTranslations("FinanceShared")
  const tCommon = useTranslations("Common")
  return (
    <div
      data-slot="selection-bar"
      role="toolbar"
      aria-label={t("selectedCount", { count })}
      className={cn(
        "border-brand-primary bg-brand-primary/10 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2",
        className,
      )}
      {...props}
    >
      <Checkbox checked aria-label={t("clearSelection")} onCheckedChange={onClear} />
      <span className="text-content-primary text-[13px] leading-5 font-medium">{t("selectedCount", { count })}</span>
      <div className="ms-auto flex items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onClear}>
          {tCommon("clear")}
        </Button>
      </div>
    </div>
  )
}

export {
  ColumnChooser,
  FilterBar,
  FilterChip,
  FilterIcon,
  FilterSearch,
  GroupBySelect,
  ResultCount,
  SelectionBar,
}
