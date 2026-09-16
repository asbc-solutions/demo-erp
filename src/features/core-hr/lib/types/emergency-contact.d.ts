export type EmergencyContact = {
  id: string
  employee_id: string
  full_name: string
  full_name_local: string | null
  relationship: string
  phone_primary: string
  phone_secondary: string | null
  email: string | null
  address: string | null
  national_id: string | null
  is_primary: boolean
  primary_label: string
}

export type EmergencyContactListParams = {
  page?: number
  per_page?: number
  search?: string
  employee_id?: string
  is_primary?: boolean
  relationship?: string
}

export type CreateEmergencyContactPayload = {
  full_name: string
  full_name_local?: string
  relationship: string
  phone_primary: string
  phone_secondary?: string
  email?: string
  address?: string
  national_id?: string
  is_primary?: boolean
}

export type UpdateEmergencyContactPayload = Partial<CreateEmergencyContactPayload>
