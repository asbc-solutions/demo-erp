/**
 * Wire types for the Compliance Access tab (bruno/Compliance/Access/*.bru).
 *
 * Architectural note from the backend docs: Access has no role model of its own.
 * It's a read-only projection over the RBAC roles that already exist in the
 * system — editing a role's permissions happens in RBAC (`PUT /roles/{id}/permissions`),
 * not here. `is_system` means "predefined role", not "protected role".
 */

export type AccessRoleRef = { id: string; name: string }

export type AccessMember = {
  id: number
  name: string
  email: string
  initials: string
  is_active: boolean
  employee_id: string | null
  roles: AccessRoleRef[]
  created_at: string
}

export type AccessMembersParams = {
  search?: string
  role_id?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export type AccessRole = {
  id: string
  name: string
  description: string
  is_system: boolean
  member_count: number
  granted_resource_count: number
}

/** none | read | write | approval_required — `none` is explicit, never absent. */
export type PermissionMatrixLevel = "none" | "read" | "write" | "approval_required"

export type PermissionMatrixResource = {
  resource: string
  description: string
  by_role: Record<string, PermissionMatrixLevel>
}

export type PermissionMatrix = {
  roles: AccessRoleRef[]
  resources: PermissionMatrixResource[]
}
