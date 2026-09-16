"use client"

import { cn } from "@/src/shared/lib/utils/utils"

import { useSalesMasterData } from "../../lib/queries/master-data"
import type { SalesMasterData } from "../../lib/types"

export const SALES_SELECT_CLASS_NAME =
  "border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"

/** The shape every `/sales/master-data` lookup list shares. */
export type MasterDataEntry = {
  id: string
  code: string
  name_ar: string
  name_en: string
  requires_note?: boolean
  requires_reference?: boolean
}

export type MasterDataField = keyof SalesMasterData

/** Resolves the currently selected lookup so callers can honour `requires_note` / `requires_reference`. */
export function useMasterDataEntry(
  field: MasterDataField,
  id: string,
): MasterDataEntry | undefined {
  const { data } = useSalesMasterData()
  const entries: MasterDataEntry[] = data?.[field] ?? []
  return entries.find((entry) => entry.id === id)
}

/**
 * Required `<select>` over one `/sales/master-data` lookup list.
 *
 * The lists are read-only seed data with no write endpoint, so an empty list is a real
 * state a user can land in — it renders an explanation instead of a silently empty dropdown.
 * Keeping `value` empty until a choice is made lets callers gate submit on `!value` alone,
 * which covers the loading, failed and unseeded cases in one condition.
 */
export function MasterDataSelect({
  field,
  name,
  label,
  value,
  onValueChange,
  emptyMessage,
  placeholder = "Select an option…",
  className,
}: Readonly<{
  field: MasterDataField
  name: string
  label: string
  value: string
  onValueChange: (value: string) => void
  emptyMessage: string
  placeholder?: string
  className?: string
}>) {
  const { data, isPending, isError, refetch } = useSalesMasterData()
  const entries: MasterDataEntry[] = data?.[field] ?? []

  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-content-secondary">
        {label} <span className="text-brand-danger">*</span>
      </span>
      <select
        name={name}
        className={SALES_SELECT_CLASS_NAME}
        required
        disabled={entries.length === 0}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        <option value="" disabled>
          {isPending ? "Loading…" : placeholder}
        </option>
        {entries.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name_en}
          </option>
        ))}
      </select>
      {isError ? (
        <span className="flex items-center gap-2 text-xs text-brand-danger">
          Couldn&apos;t load this list.
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </span>
      ) : null}
      {!isPending && !isError && entries.length === 0 ? (
        <span className="text-xs text-content-tertiary">{emptyMessage}</span>
      ) : null}
    </label>
  )
}
