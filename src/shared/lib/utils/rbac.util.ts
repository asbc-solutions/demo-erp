import type { PermissionLevel, PermissionsMap } from "@/src/shared/lib/types/permissions"

export const HR_ROLES = {
  hrAdmin: "HR Admin",
  hrManager: "HR Manager",
  manager: "Manager",
  employee: "Employee",
  recruiter: "Recruiter",
  finance: "Finance",
} as const

export type TRole = (typeof HR_ROLES)[keyof typeof HR_ROLES]

const LEVEL_RANK: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  approval_required: 2,
  write: 3,
}

export function hasPermission(
  resource: string,
  required: PermissionLevel,
  permissions: PermissionsMap
): boolean {
  const actual = permissions[resource] ?? "none"
  return LEVEL_RANK[actual] >= LEVEL_RANK[required]
}

export function canRead(resource: string, permissions: PermissionsMap): boolean {
  return hasPermission(resource, "read", permissions)
}

export function canWrite(resource: string, permissions: PermissionsMap): boolean {
  return hasPermission(resource, "write", permissions)
}

export function needsApproval(resource: string, permissions: PermissionsMap): boolean {
  return (permissions[resource] ?? "none") === "approval_required"
}

export type AccessState = "no_access" | "read_only" | "approval_required" | "full_access"

export function getAccessState(resource: string, permissions: PermissionsMap): AccessState {
  const level = permissions[resource] ?? "none"
  switch (level) {
    case "none": return "no_access"
    case "read": return "read_only"
    case "approval_required": return "approval_required"
    case "write": return "full_access"
  }
}
