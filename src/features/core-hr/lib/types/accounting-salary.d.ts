export type PostingStatus = "draft" | "pending" | "posted" | "reversed"

export type AccountingSalary = {
  id: string
  pay_period: string
  fiscal_year: number
  fiscal_month: number
  currency_code: string
  cost_centre_id: string
  gross_salary_budget: number
  gross_salary_actual: number
  net_salary_actual: number
  allowances_total: number
  deductions_total: number
  employer_contrib: number
  gl_account_code: string
  posting_status: PostingStatus
  posting_status_label: string
  journal_ref: string | null
  posted_date: string | null
}

export type AccountingSalaryListParams = {
  page?: number
  per_page?: number
  pay_period?: string
  fiscal_year?: number
  fiscal_month?: number
  currency_code?: string
  cost_centre_id?: string
  posting_status?: PostingStatus
}

export type CreateAccountingSalaryPayload = {
  cost_centre_id: string
  pay_period: string
  fiscal_year: number
  fiscal_month: number
  currency_code: string
  gross_salary_budget: number
  gross_salary_actual: number
  net_salary_actual: number
  allowances_total: number
  deductions_total: number
  employer_contrib: number
  gl_account_code: string
}
