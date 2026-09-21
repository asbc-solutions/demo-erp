"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { Spinner } from "@/src/shared/components/ui/spinner"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { financeResourceForGroup } from "../../lib/constants/permissions"
import { matchFinanceNav } from "../../lib/utils/nav"

/**
 * Gates the current finance page on its section's resource, so pages never
 * gate themselves. Each section is independently grantable.
 */
function FinanceSectionGate({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { accessState, isLoading } = usePermissions()
  const match = matchFinanceNav(pathname)
  const resource = match ? financeResourceForGroup(match.group.id) : null

  if (!resource) return <>{children}</>

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Spinner className="text-content-tertiary size-5" />
      </div>
    )
  }

  if (accessState(resource) === "no_access") {
    return (
      <div className="p-6">
        <AccessDeniedCard description="Ask an admin to grant your role access to this Finance section." />
      </div>
    )
  }

  return <>{children}</>
}

export { FinanceSectionGate }
