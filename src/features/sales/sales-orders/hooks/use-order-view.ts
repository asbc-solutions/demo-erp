"use client"

import { useCallback, useState } from "react"

export type OrderView = { mode: "list" } | { mode: "detail"; orderId: string }

export function useOrderView() {
  const [view, setView] = useState<OrderView>({ mode: "list" })

  const showList = useCallback(() => setView({ mode: "list" }), [])
  const showDetail = useCallback(
    (orderId: string) => setView({ mode: "detail", orderId }),
    [],
  )

  return { view, showList, showDetail }
}
