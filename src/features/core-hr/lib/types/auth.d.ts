export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role?: string | null
}

export type AuthTokenResponse = {
  token: string
  user: AuthUser
}

export type HrRole =
  | "HR Admin"
  | "HR Manager"
  | "Manager"
  | "Employee"
  | "Recruiter"
  | "Finance"
