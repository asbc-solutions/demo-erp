"use client"

import type { ReactNode } from "react"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { INTEGRATIONS_RESOURCES } from "../lib/constants/permissions"
import { IntegrationsPageSpinner } from "./shared/integrations-loading"

/**
 * Gates the Integrations screen on the `settings.integrations` permission
 * resource. See the ⚠️ warning in lib/constants/permissions.ts — do not swap
 * this for the singular `integration` slug, which is a different resource.
 */
export function IntegrationsAccessGate({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <IntegrationsPageSpinner />
  }

  if (accessState(INTEGRATIONS_RESOURCES.integrations) === "no_access") {
    return (
      <AccessDeniedCard description="Ask an admin to grant your role access to Integrations." />
    )
  }

  return <>{children}</>
}
