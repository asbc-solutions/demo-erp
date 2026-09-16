export type Salesperson = {
  id: string
  name: string
  email: string | null
  /** Optional link to an existing login account — rare non-uuid FK. */
  user_id: number | null
  is_active: boolean
}

export type SalespersonListParams = {
  is_active?: boolean
  search?: string
  page?: number
  per_page?: number
}

export type CreateSalespersonPayload = {
  name: string
  email?: string
  user_id?: number
  is_active?: boolean
}

export type UpdateSalespersonPayload = Partial<CreateSalespersonPayload>
