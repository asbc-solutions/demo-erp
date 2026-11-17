"use client"

import { SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/shared/components/ui/popover"
import { cn } from "@/src/shared/lib/utils/utils"

export type HrFilterOption = Readonly<{ value: string; label: string }>

export type HrFilterGroup = Readonly<{
  /** Stable key used in the values map. */
  id: string
  /** Uppercase section heading shown above the checkboxes. */
  label: string
  options: readonly HrFilterOption[]
}>

/** Map of group id → selected option values. */
export type HrFilterValues = Readonly<Record<string, readonly string[]>>

/** Total number of active selections across every group. */
export function countActiveFilters(values: HrFilterValues): number {
  return Object.values(values).reduce((total, list) => total + list.length, 0)
}

type HrFilterPanelProps = Readonly<{
  groups: readonly HrFilterGroup[]
  values: HrFilterValues
  onChange: (next: HrFilterValues) => void
  /** Extra classes forwarded to the trigger button. */
  className?: string
}>

/**
 * Reusable "Filters" popover for HR list pages. Renders grouped checkbox
 * filters (Status / Department / …) matching the HR Core design and applies
 * selections live via `onChange`.
 */
export function HrFilterPanel({
  groups,
  values,
  onChange,
  className,
}: HrFilterPanelProps) {
  const t = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const activeCount = countActiveFilters(values)

  const toggle = (groupId: string, value: string, checked: boolean) => {
    const current = values[groupId] ?? []
    const next = checked
      ? [...current, value]
      : current.filter((entry) => entry !== value)
    onChange({ ...values, [groupId]: next })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className={cn("rounded-[10px]", className)}>
          <SlidersHorizontal />
          {tCommon("filters")}
          {activeCount > 0 && (
            <span className="bg-brand-primary ms-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[248px] p-0">
        <div className="border-stroke-light flex items-center justify-between border-b px-4 py-3">
          <span className="text-content-primary text-sm font-semibold">
            {tCommon("filters")}
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-brand-primary text-xs font-medium hover:underline"
            >
              {t("clearAll")}
            </button>
          )}
        </div>

        <div className="thin-scrollbar flex max-h-[320px] flex-col gap-4 overflow-y-auto p-4">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <p className="text-content-quaternary text-[11px] font-semibold tracking-[0.6px] uppercase">
                {group.label}
              </p>

              {group.options.length === 0 ? (
                <p className="text-content-quaternary text-xs leading-4">
                  {t("noOptions")}
                </p>
              ) : (
                group.options.map((option) => {
                  const id = `${group.id}-${option.value}`
                  const checked = (values[group.id] ?? []).includes(
                    option.value,
                  )
                  return (
                    <label
                      key={option.value}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2.5"
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(state) =>
                          toggle(group.id, option.value, state === true)
                        }
                      />
                      <span className="text-content-secondary text-sm leading-5">
                        {option.label}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
