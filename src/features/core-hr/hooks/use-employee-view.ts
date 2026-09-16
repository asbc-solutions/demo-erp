"use client"

import { useCallback, useState } from "react"

export type EmployeeView =
  | { mode: "list" }
  | { mode: "add" }
  | { mode: "edit"; employeeId: string }
  | { mode: "detail"; employeeId: string }

export function useEmployeeView() {
  const [view, setView] = useState<EmployeeView>({ mode: "list" })

  const showList = useCallback(() => setView({ mode: "list" }), [])
  const showAdd = useCallback(() => setView({ mode: "add" }), [])
  const showEdit = useCallback(
    (employeeId: string) => setView({ mode: "edit", employeeId }),
    [],
  )
  const showDetail = useCallback(
    (employeeId: string) => setView({ mode: "detail", employeeId }),
    [],
  )

  return { view, showList, showAdd, showEdit, showDetail }
}
