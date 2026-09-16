"use client"

import type { ReactNode } from "react"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import type { SalesResource } from "../../lib/constants/permissions"
import { SalesPageSpinner } from "./sales-loading"

export function SalesAccessGate({
  resource,
  children,
}: Readonly<{ resource: SalesResource; children: ReactNode }>) {
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <SalesPageSpinner />
  }

  if (accessState(resource) === "no_access") {
    return (
      <AccessDeniedCard description="Ask an admin to grant your role access to the Sales module." />
    )
  }

  return <>{children}</>
}
