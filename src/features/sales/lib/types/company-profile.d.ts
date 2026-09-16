export type CompanyProfile = {
  company_name: string
  company_tax_number: string
  has_logo: boolean
}

export type UpdateCompanyProfilePayload = {
  company_name?: string
  company_tax_number?: string
}
