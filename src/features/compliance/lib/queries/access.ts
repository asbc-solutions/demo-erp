"use client"

import { useQuery } from "@tanstack/react-query"

import { complianceAccessApi } from "../api/access"
import { complianceKeys } from "../constants/query-keys"
import type { AccessMembersParams } from "../types/access"

export function useAccessMembers(params?: AccessMembersParams) {
  return useQuery({
    queryKey: complianceKeys.access.members(params),
    queryFn: () => complianceAccessApi.listMembers(params).then((r) => r.data),
  })
}

export function useAccessRoles() {
  return useQuery({
    queryKey: complianceKeys.access.roles(),
    queryFn: () => complianceAccessApi.listRoles().then((r) => r.data.data),
  })
}

export function usePermissionMatrix() {
  return useQuery({
    queryKey: complianceKeys.access.permissionMatrix(),
    queryFn: () => complianceAccessApi.getPermissionMatrix().then((r) => r.data.data),
  })
}
