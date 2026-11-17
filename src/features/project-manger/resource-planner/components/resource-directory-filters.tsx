"use client"

import { ChevronDown, Filter, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { cn } from "@/src/shared/lib/utils/utils"

/** Allocation bands the Availability filter narrows the directory by. */
export type AvailabilityBand = "available" | "booked" | "over"

type FilterOption = { value: string; label: string }

export const AVAILABILITY_OPTIONS = [
  "available",
  "booked",
  "over",
] as const satisfies readonly AvailabilityBand[]

/** A resource with no allocation data can't be placed in a band, so it drops out. */
export function matchesAvailability(
  band: AvailabilityBand,
  allocationPct: number | null,
): boolean {
  if (allocationPct == null) return false
  if (band === "available") return allocationPct < 80
  if (band === "booked") return allocationPct >= 80 && allocationPct <= 100
  return allocationPct > 100
}

export type ResourceFilterValues = {
  department: string | null
  availability: AvailabilityBand | null
  skill: string | null
}

export const EMPTY_RESOURCE_FILTERS: ResourceFilterValues = {
  department: null,
  availability: null,
  skill: null,
}

export function hasActiveFilters(values: ResourceFilterValues): boolean {
  return !!(values.department || values.availability || values.skill)
}

/** Radix `RadioGroup` needs a non-empty value, so "no filter" gets a sentinel. */
const ALL_VALUE = "__all__"

type FilterMenuProps = Readonly<{
  label: string
  allLabel: string
  value: string | null
  options: readonly FilterOption[]
  onChange: (value: string | null) => void
}>

function FilterMenu({
  label,
  allLabel,
  value,
  options,
  onChange,
}: FilterMenuProps) {
  const t = useTranslations("ProjectsResourcePlanner")
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={options.length === 0}
          aria-label={t("filterBy", { label })}
          className={cn(
            "h-9 gap-2 px-3 text-[13px]",
            selected && "border-brand-primary text-brand-primary",
          )}
        >
          <Filter className="size-3.5" aria-hidden />
          {selected
            ? t("filterSelected", { label, value: selected.label })
            : label}
          <ChevronDown className="size-3.5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="thin-scrollbar max-h-72 overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={value ?? ALL_VALUE}
          onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
        >
          <DropdownMenuRadioItem value={ALL_VALUE}>
            {allLabel}
          </DropdownMenuRadioItem>
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

type ResourceDirectoryFiltersProps = Readonly<{
  values: ResourceFilterValues
  onChange: (values: ResourceFilterValues) => void
  departments: readonly string[]
  skills: readonly string[]
}>

export function ResourceDirectoryFilters({
  values,
  onChange,
  departments,
  skills,
}: ResourceDirectoryFiltersProps) {
  const t = useTranslations("ProjectsResourcePlanner")
  const tCommon = useTranslations("Common")
  const toOptions = (items: readonly string[]): FilterOption[] =>
    items.map((item) => ({ value: item, label: item }))

  return (
    <>
      <FilterMenu
        label={t("filterDepartment")}
        allLabel={t("allDepartments")}
        value={values.department}
        options={toOptions(departments)}
        onChange={(department) => onChange({ ...values, department })}
      />
      <FilterMenu
        label={t("filterAvailability")}
        allLabel={t("allAvailability")}
        value={values.availability}
        options={AVAILABILITY_OPTIONS.map((band) => ({
          value: band,
          label: t(`availability.${band}`),
        }))}
        onChange={(availability) =>
          onChange({
            ...values,
            availability: availability as AvailabilityBand | null,
          })
        }
      />
      <FilterMenu
        label={t("filterSkills")}
        allLabel={t("allSkills")}
        value={values.skill}
        options={toOptions(skills)}
        onChange={(skill) => onChange({ ...values, skill })}
      />
      {hasActiveFilters(values) && (
        <Button
          variant="ghost"
          className="text-content-tertiary h-9 gap-1.5 px-2 text-[13px]"
          onClick={() => onChange(EMPTY_RESOURCE_FILTERS)}
        >
          <X className="size-3.5" aria-hidden />
          {tCommon("clear")}
        </Button>
      )}
    </>
  )
}
