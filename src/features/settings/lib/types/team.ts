export type TeamMemberRole = {
  id: string
  name: string
}

export type TeamMember = {
  id: number
  name: string
  email: string
  initials: string
  is_active: boolean
  employee_id: number | null
  roles: TeamMemberRole[]
  created_at: string
}

export type TeamListParams = {
  search?: string
  role_id?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export type AssignableRole = {
  id: string
  name: string
  description: string
  is_system: boolean
  member_count: number
  granted_resource_count: number
}

export type InviteMemberPayload = {
  name: string
  email: string
  role_id: string
}

export type UpdateMemberRolesPayload = {
  /** Final, complete list of role ids for the member — this REPLACES, not appends. `[]` clears all roles. */
  role_ids: string[]
}

export type DeactivateMemberResult = {
  success: boolean
  message: string
}
