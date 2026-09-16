export type CrmReflectionStatus = "pending" | "reflected" | "failed" | "skipped"

export type CrmReflection = {
  id: string
  customer_id: string
  customer_name: string
  trigger_invoice_id: string
  trigger_invoice_number: string
  status: CrmReflectionStatus
  status_label: string
  dispatcher: string
  crm_customer_ref: string | null
  attempts: number
  error_message: string | null
  reflected_at: string | null
  created_at: string
}

export type CrmReflectionListParams = {
  status?: CrmReflectionStatus
  page?: number
  per_page?: number
}
