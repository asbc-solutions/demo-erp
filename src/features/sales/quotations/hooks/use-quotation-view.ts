"use client"

import { useCallback, useState } from "react"

export type QuotationView =
  | { mode: "list" }
  | { mode: "detail"; quotationId: string }

export function useQuotationView() {
  const [view, setView] = useState<QuotationView>({ mode: "list" })

  const showList = useCallback(() => setView({ mode: "list" }), [])
  const showDetail = useCallback(
    (quotationId: string) => setView({ mode: "detail", quotationId }),
    [],
  )

  return { view, showList, showDetail }
}
