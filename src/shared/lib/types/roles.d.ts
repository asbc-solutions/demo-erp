import type { PermissionLevel } from "./permissions"

export type Role = {
  id: string
  role_name: string
  description: string
  user_count: number
  is_active: boolean
  is_system: boolean
  created_at: string
}

export type RolePermissionEntry = {
  permission_id: string
  resource: string
  action: string
  description: string
  permission_level: PermissionLevel
  permission_level_label: string
}

export type RolePermissionsMatrix = {
  role: Pick<Role, "id" | "role_name" | "user_count" | "is_active">
  permissions: RolePermissionEntry[]
}

export type UpdateRolePermissionsPayload = {
  permissions: Array<{
    resource: string
    permission_level: PermissionLevel
  }>
}
