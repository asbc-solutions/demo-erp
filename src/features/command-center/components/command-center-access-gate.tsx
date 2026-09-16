"use client"

import type { ReactNode } from "react"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { COMMAND_CENTER_RESOURCE } from "../lib/constants/permissions"
import { CommandCenterPageSpinner } from "./shared/command-center-loading"

export function CommandCenterAccessGate({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { accessState, isLoading } = usePermissions()

  if (isLoading) {
    return <CommandCenterPageSpinner />
  }

  if (accessState(COMMAND_CENTER_RESOURCE) === "no_access") {
    return (
      <AccessDeniedCard description="Ask an admin to grant your role access to the Command Center." />
    )
  }

  return <>{children}</>
}
