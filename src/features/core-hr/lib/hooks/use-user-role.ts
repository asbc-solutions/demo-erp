"use client"

import { useSession } from "next-auth/react"
import { HR_ROLES, type TRole } from "@/src/shared/lib/utils/rbac.util"

export function useUserRole(): TRole | null {
  const { data: session } = useSession()
  return (session?.user?.role as TRole) ?? null
}

export function useIsHrAdmin(): boolean {
  const role = useUserRole()
  return role === HR_ROLES.hrAdmin
}

export function useIsManager(): boolean {
  const role = useUserRole()
  return role === HR_ROLES.hrAdmin || role === HR_ROLES.hrManager || role === HR_ROLES.manager
}
