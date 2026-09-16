"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

import { authApi } from "@/src/shared/lib/apis/auth"
import { permissionsKeys } from "@/src/shared/lib/constants/query-keys"
import {
  canRead,
  canWrite,
  hasPermission,
  needsApproval,
  getAccessState,
} from "@/src/shared/lib/utils/rbac.util"
import type { PermissionLevel, PermissionsMap } from "@/src/shared/lib/types/permissions"

export function usePermissions() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  const { data, isLoading } = useQuery({
    queryKey: permissionsKeys.me(),
    queryFn: () => authApi.myPermissions().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  const permissions: PermissionsMap = data?.permissions ?? {}
  const role = session?.user?.role ?? null

  return {
    permissions,
    role,
    isLoading: status === "loading" || isLoading,
    can: {
      read: (resource: string) => canRead(resource, permissions),
      write: (resource: string) => canWrite(resource, permissions),
      access: (resource: string, level: PermissionLevel) =>
        hasPermission(resource, level, permissions),
    },
    needsApproval: (resource: string) => needsApproval(resource, permissions),
    accessState: (resource: string) => getAccessState(resource, permissions),
  }
}
