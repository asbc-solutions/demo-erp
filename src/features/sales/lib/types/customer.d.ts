export type CustomerType = "company" | "individual"
export type CustomerStatus = "active" | "inactive" | "blocked"
export type CustomerTab = "all" | CustomerStatus

export type CustomerAddressType = "billing" | "shipping"

export type CustomerAddress = {
  id?: string
  address_type: CustomerAddressType
  line: string
  city: string
  governorate: string
  country_code?: string
  is_default?: boolean
}

/** Row shape from GET /sales/customers (flat/denormalized, per docs/sales.md §1). */
export type CustomerListItem = {
  id: string
  name: string
  customer_type: CustomerType
  customer_type_label: string
  phone: string
  email: string
  assigned_salesperson_name: string
  status: CustomerStatus
  status_label: string
}

/**
 * GET /sales/customers/:id — Bruno docs don't give an example JSON for this
 * endpoint (see docs/sales.md §4.2). Modeled conservatively from the list
 * shape plus the documented Create Customer fields; confirm against a live
 * call before relying on `assigned_salesperson_id`/`addresses` here.
 */
export type Customer = CustomerListItem & {
  tax_number: string | null
  source: string | null
  assigned_salesperson_id: string
  addresses: CustomerAddress[]
}

export type CustomerListParams = {
  tab?: CustomerTab
  type?: CustomerType
  q?: string
  page?: number
  per_page?: number
}

export type CreateCustomerPayload = {
  name: string
  customer_type: CustomerType
  phone: string
  email?: string
  tax_number?: string
  source?: string
  assigned_salesperson_id: string
  addresses?: CustomerAddress[]
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

export type BlockCustomerPayload = {
  /** Minimum 10 characters (backend-enforced). */
  reason: string
}

export type CustomerExportFilters = {
  tab?: CustomerTab
  type?: CustomerType
  q?: string
}
