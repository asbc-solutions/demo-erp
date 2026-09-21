"use client"

import * as React from "react"

import type { FinanceScope, PeriodKey } from "../types/common"

/** The design opens on EG-01 in April 2026, the open period. */
const DEFAULT_SCOPE: FinanceScope = { entityId: "EG-01", period: "2026-04" }

type FinanceScopeContextValue = {
  scope: FinanceScope
  setEntityId: (entityId: string) => void
  setPeriod: (period: PeriodKey) => void
}

const FinanceScopeContext = React.createContext<FinanceScopeContextValue | null>(null)

/**
 * Holds the entity and period chosen in the finance toolbar. It lives in the
 * finance layout, which stays mounted across finance routes, so the choice
 * survives moving between sections.
 */
export function FinanceScopeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [scope, setScope] = React.useState<FinanceScope>(DEFAULT_SCOPE)

  const value = React.useMemo<FinanceScopeContextValue>(
    () => ({
      scope,
      setEntityId: (entityId) => setScope((current) => ({ ...current, entityId })),
      setPeriod: (period) => setScope((current) => ({ ...current, period })),
    }),
    [scope],
  )

  return <FinanceScopeContext.Provider value={value}>{children}</FinanceScopeContext.Provider>
}

export function useFinanceScope(): FinanceScopeContextValue {
  const value = React.useContext(FinanceScopeContext)
  if (!value) throw new Error("useFinanceScope must be used inside FinanceScopeProvider")
  return value
}

/** Scope as request params: `{ entity_id, period }`. */
export function useFinanceScopeParams(): { entity_id: string; period: PeriodKey } {
  const { scope } = useFinanceScope()
  return { entity_id: scope.entityId, period: scope.period }
}
