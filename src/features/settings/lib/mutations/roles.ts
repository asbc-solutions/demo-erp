"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { rolesApi } from "@/src/shared/lib/apis/roles"
import { permissionsKeys } from "@/src/shared/lib/constants/query-keys"
import type { UpdateRolePermissionsPayload } from "@/src/shared/lib/types/roles"

import { settingsKeys } from "../constants/query-keys"

export function useUpdateRolePermissions(roleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRolePermissionsPayload) =>
      rolesApi.updatePermissions(roleId, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.roles.permissions(roleId) })
      qc.invalidateQueries({ queryKey: permissionsKeys.me() })
    },
  })
}
