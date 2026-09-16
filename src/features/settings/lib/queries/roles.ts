"use client"

import { useQuery } from "@tanstack/react-query"

import { rolesApi } from "@/src/shared/lib/apis/roles"

import { settingsKeys } from "../constants/query-keys"

export function useRoles() {
  return useQuery({
    queryKey: settingsKeys.roles.list(),
    queryFn: () => rolesApi.list().then((r) => r.data.data),
  })
}

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: settingsKeys.roles.permissions(roleId ?? ""),
    queryFn: () => rolesApi.getPermissions(roleId as string).then((r) => r.data.data),
    enabled: !!roleId,
  })
}
