import type { AvatarTone } from "./employee"

export type EmergencyContactRow = {
  id: string
  contactName: string
  employeeName: string
  relationship: string
  phone: string
  email: string | null
  isPrimary: boolean
  contactInitials?: string
  avatarTone: AvatarTone
}
