"use client"

import { useQuery } from "@tanstack/react-query"

import { teamApi } from "../api/team"
import { settingsKeys } from "../constants/query-keys"
import type { TeamListParams } from "../types/team"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useTeamMembers(params?: TeamListParams) {
  return useQuery({
    queryKey: settingsKeys.team.list(params),
    queryFn: () =>
      teamApi.list(params).then((r) => ({ data: r.data.data, meta: r.data.meta })),
  })
}

export function useAssignableRoles(options?: QueryHookOptions) {
  return useQuery({
    queryKey: settingsKeys.team.assignableRoles(),
    queryFn: () => teamApi.assignableRoles().then((r) => r.data.data),
    ...options,
  })
}
