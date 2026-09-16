export type TaxMode = "exclusive" | "inclusive"

export type SalesSettings = {
  id: string
  branch_id: number | null
  quotation_number_format: string
  order_number_format: string
  invoice_number_format: string
  default_tax_rate: number
  tax_mode: TaxMode
  tax_mode_label: string
  default_validity_days: number
  auto_expire_quotations: boolean
  company_name: string
  company_tax_number: string
  has_company_logo: boolean
}

export type UpdateSalesSettingsPayload = Partial<{
  quotation_number_format: string
  order_number_format: string
  invoice_number_format: string
  default_tax_rate: number
  tax_mode: TaxMode
  default_validity_days: number
  auto_expire_quotations: boolean
}>

export type NumberingPreview = {
  quotation: string
  order: string
  invoice: string
}
