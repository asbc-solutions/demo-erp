"use client"

import { useCallback, useState } from "react"

export type CustomerView = { mode: "list" } | { mode: "detail"; customerId: string }

/**
 * Swaps the customers screen between the directory list and a single customer's
 * detail in place. Mirrors `use-quotation-view` — Sales keeps detail views inside
 * the module route rather than behind a `/[id]` segment.
 */
export function useCustomerView() {
  const [view, setView] = useState<CustomerView>({ mode: "list" })

  const showList = useCallback(() => setView({ mode: "list" }), [])
  const showDetail = useCallback(
    (customerId: string) => setView({ mode: "detail", customerId }),
    [],
  )

  return { view, showList, showDetail }
}
