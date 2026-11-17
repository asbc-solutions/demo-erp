"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import type { OperationsResource } from "../lib/constants/permissions"
import { OperationsPageSpinner } from "./shared/operations-loading"

/**
 * Projects/Tasks/Vendors are gated by three independent permission resources
 * (`operations.projects` / `operations.tasks` / `operations.vendors`), so this gate
 * is applied per-tab rather than once around the whole module.
 */
export function OperationsAccessGate({
  resource,
  children,
}: Readonly<{ resource: OperationsResource; children: ReactNode }>) {
  const t = useTranslations("OperationsModule")
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <OperationsPageSpinner />
  }

  if (accessState(resource) === "no_access") {
    return (
      <AccessDeniedCard description={t("accessDenied")} />
    )
  }

  return <>{children}</>
}
