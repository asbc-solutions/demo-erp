import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type {
  AccessMember,
  AccessMembersParams,
  AccessRole,
  PermissionMatrix,
} from "../types/access"

export const complianceAccessApi = {
  listMembers: (params?: AccessMembersParams) =>
    httpClient.get<ApiResponse<AccessMember[]> & { meta: PaginationMeta }>(
      "/compliance/access/members",
      { params },
    ),

  listRoles: () =>
    httpClient.get<ApiResponse<AccessRole[]>>("/compliance/access/roles"),

  getPermissionMatrix: () =>
    httpClient.get<ApiResponse<PermissionMatrix>>("/compliance/access/permission-matrix"),
}
