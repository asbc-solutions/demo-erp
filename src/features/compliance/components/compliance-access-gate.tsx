"use client"

import type { ReactNode } from "react"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import type { ComplianceResource } from "../lib/constants/permissions"
import { CompliancePageSpinner } from "./shared/compliance-loading"

export function ComplianceAccessGate({
  resource,
  children,
}: Readonly<{ resource: ComplianceResource; children: ReactNode }>) {
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <CompliancePageSpinner />
  }

  if (accessState(resource) === "no_access") {
    return (
      <AccessDeniedCard description="Ask an admin to grant your role access to this Compliance section." />
    )
  }

  return <>{children}</>
}
