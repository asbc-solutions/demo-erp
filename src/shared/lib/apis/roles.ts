import { httpClient } from "./http-client"
import type { ApiResponse } from "../types/api"
import type {
  Role,
  RolePermissionEntry,
  RolePermissionsMatrix,
  UpdateRolePermissionsPayload,
} from "../types/roles"

export const rolesApi = {
  list: () => httpClient.get<ApiResponse<Role[]>>("/roles"),

  getPermissions: (roleId: string) =>
    httpClient.get<ApiResponse<RolePermissionsMatrix>>(`/roles/${roleId}/permissions`),

  updatePermissions: (roleId: string, payload: UpdateRolePermissionsPayload) =>
    httpClient.put<ApiResponse<RolePermissionEntry[]>>(
      `/roles/${roleId}/permissions`,
      payload,
    ),
}
