export type PermissionLevel = "none" | "read" | "approval_required" | "write"

export type PermissionsMap = Record<string, PermissionLevel>

export type MyPermissionsResponse = {
  user_id: number
  permissions: PermissionsMap
}
