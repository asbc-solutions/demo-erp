"use client"

import type { ReactNode } from "react"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import type { FinanceResource } from "../lib/constants/permissions"
import { FinancePageSpinner } from "./shared/finance-loading"

/**
 * Gates a single Finance tab on its own resource slug — there's no broader
 * "finance.access" permission, each of cashflow/expenses/invoices/reports is
 * independently grantable, so the module gates per-tab rather than as a whole.
 */
export function FinanceAccessGate({
  resource,
  children,
}: Readonly<{ resource: FinanceResource; children: ReactNode }>) {
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <FinancePageSpinner />
  }

  if (accessState(resource) === "no_access") {
    return (
      <AccessDeniedCard description="Ask an admin to grant your role access to this Finance section." />
    )
  }

  return <>{children}</>
}
