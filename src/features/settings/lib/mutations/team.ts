"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { teamApi } from "../api/team"
import { settingsKeys } from "../constants/query-keys"
import type { InviteMemberPayload, UpdateMemberRolesPayload } from "../types/team"

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) =>
      teamApi.invite(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.team.all }),
  })
}

export function useUpdateMemberRoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMemberRolesPayload }) =>
      teamApi.updateRoles(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.team.all }),
  })
}

export function useDeactivateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => teamApi.deactivate(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.team.all }),
  })
}
