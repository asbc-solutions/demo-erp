import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type {
  AssignableRole,
  DeactivateMemberResult,
  InviteMemberPayload,
  TeamListParams,
  TeamMember,
  UpdateMemberRolesPayload,
} from "../types/team"

export const teamApi = {
  list: (params?: TeamListParams) =>
    httpClient.get<ApiResponse<TeamMember[]> & { meta: PaginationMeta }>(
      "/settings/team",
      { params },
    ),

  assignableRoles: () =>
    httpClient.get<ApiResponse<AssignableRole[]>>(
      "/settings/team/assignable-roles",
    ),

  invite: (payload: InviteMemberPayload) =>
    httpClient.post<ApiResponse<TeamMember>>("/settings/team/invite", payload),

  /** Full replace of a member's roles — role_ids not included are dropped. */
  updateRoles: (memberId: number, payload: UpdateMemberRolesPayload) =>
    httpClient.patch<ApiResponse<TeamMember>>(
      `/settings/team/${memberId}`,
      payload,
    ),

  /** Soft-deactivate (is_active = false), never a hard delete. 409 if targeting self. */
  deactivate: (memberId: number) =>
    httpClient.delete<DeactivateMemberResult>(`/settings/team/${memberId}`),
}
