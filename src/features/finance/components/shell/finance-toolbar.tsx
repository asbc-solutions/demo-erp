"use client"

import { FinanceSearch } from "./finance-search"
import { EntityPicker, PeriodPicker } from "./scope-pickers"

/** Scope bar under the app header: entity, period (with status), finance search. */
function FinanceToolbar() {
  return (
    <div
      data-slot="finance-toolbar"
      className="border-stroke-default bg-surface-muted flex flex-wrap items-center gap-3 border-b px-6 py-2.5"
    >
      <EntityPicker />
      <PeriodPicker />
      <FinanceSearch className="w-full sm:ml-auto sm:max-w-md" />
    </div>
  )
}

export { FinanceToolbar }
