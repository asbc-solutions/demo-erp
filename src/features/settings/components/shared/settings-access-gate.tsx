"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import type { SettingsResource } from "../../lib/constants/permissions"
import { SettingsPageSpinner } from "./settings-loading"

export function SettingsAccessGate({
  resource,
  children,
}: Readonly<{ resource: SettingsResource; children: ReactNode }>) {
  const t = useTranslations("SettingsShared")
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <SettingsPageSpinner />
  }

  if (accessState(resource) === "no_access") {
    return (
      <AccessDeniedCard description={t("accessDenied")} />
    )
  }

  return <>{children}</>
}
