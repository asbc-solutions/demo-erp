"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { COMMAND_CENTER_RESOURCE } from "../lib/constants/permissions"
import { CommandCenterPageSpinner } from "./shared/command-center-loading"

export function CommandCenterAccessGate({
  children,
}: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("CommandCenter")
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <CommandCenterPageSpinner />
  }

  if (accessState(COMMAND_CENTER_RESOURCE) === "no_access") {
    return (
      <AccessDeniedCard
        title={t("accessDeniedTitle")}
        description={t("accessDeniedDescription")}
      />
    )
  }

  return <>{children}</>
}
