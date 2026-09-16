"use client"

import { useCallback, useState } from "react"

export type InvoiceView = { mode: "list" } | { mode: "detail"; invoiceId: string }

export function useInvoiceView() {
  const [view, setView] = useState<InvoiceView>({ mode: "list" })

  const showList = useCallback(() => setView({ mode: "list" }), [])
  const showDetail = useCallback(
    (invoiceId: string) => setView({ mode: "detail", invoiceId }),
    [],
  )

  return { view, showList, showDetail }
}
