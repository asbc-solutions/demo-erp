export type VendorStatus = "active" | "pending" | "inactive"

/** Derived from `status` server-side — never send this on create/update. */
export type VendorPrimaryAction = "manage" | "renew" | "activate"

/** Shape returned by GET /operations/vendors and as the `data` of create/action responses. */
export type VendorListItem = {
  id: string
  name: string
  status: VendorStatus
  status_label: string
  primary_action: VendorPrimaryAction
  category: string
  monthly_spend: number
  currency_code: string
  contract_end: string | null
  days_to_contract_end: number | null
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  tags: string[]
}

export type VendorListParams = {
  status?: VendorStatus
  category?: string
  search?: string
  page?: number
  per_page?: number
}

export type CreateVendorPayload = {
  name: string
  category: string
  status?: VendorStatus
  contact_name?: string
  contact_role?: string
  contact_email?: string
  monthly_spend?: number
  contract_end?: string
  /** Array of strings on the wire — the form collects it as a comma-separated string. */
  tags?: string[]
}

/** POST /operations/vendors/{id}/renew — `contract_end` must be a future date. */
export type RenewVendorPayload = {
  contract_end: string
}

/** GET /operations/vendors/kpis — the 3 tiles above the Vendors tab. */
export type VendorKpis = {
  active_vendors: number
  monthly_vendor_spend: number
  contracts_expiring_soon: number
  expiring_within_days: number
}
