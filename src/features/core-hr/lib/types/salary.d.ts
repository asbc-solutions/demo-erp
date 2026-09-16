export type SalaryRecord = {
  id: string
  basic_salary: number
  gross_salary: number
  net_salary: number
  housing_allowance: number
  transport_allowance: number
  food_allowance: number
  mobile_allowance: number
  other_allowance: number
  income_tax_pct: number
  social_insurance_pct: number
  other_deduction: number
  currency_code: string
  pay_frequency: string
  pay_frequency_label: string
  pay_method: string
  bank_name: string | null
  bank_account: string | null
  bank_iban: string | null
  effective_date: string
  end_date: string | null
  is_current: boolean
  approval_status: string
  approval_status_label: string
  change_reason: string | null
  change_type: string | null
}

export type CurrentSalaryBand = {
  min: number
  mid: number
  max: number
  currency_code: string
  within_band: boolean
  compa_ratio: number | null
}

export type CurrentSalaryResponse = {
  salary: SalaryRecord
  band: CurrentSalaryBand | null
}

export type SalaryHistoryResponse = {
  current: SalaryRecord | null
  history: SalaryRecord[]
}

export type SalaryAnalyticsDept = {
  dept_name: string
  headcount: number
  total_cost: number
  avg_salary: number
  pct_of_total: number
}

export type SalaryAnalytics = {
  total_payroll: { amount: number; mom_change_pct: number }
  average_salary: { amount: number; employee_count: number }
  highest_dept_avg: { amount: number; department: string } | null
  mom_change_pct: number
  by_department: SalaryAnalyticsDept[]
}

export type SalaryPreview = {
  gross_salary: number
  net_salary: number
  within_band: boolean | null
  compa_ratio: number | null
  band_min: number | null
  band_mid: number | null
  band_max: number | null
}

export type CreateSalaryPayload = {
  basic_salary: number
  housing_allowance?: number
  transport_allowance?: number
  food_allowance?: number
  mobile_allowance?: number
  other_allowance?: number
  income_tax_pct?: number
  social_insurance_pct?: number
  other_deduction?: number
  currency_code?: string
  pay_frequency?: string
  pay_method?: string
  bank_name?: string
  bank_account?: string
  bank_iban?: string
  effective_date?: string
  job_grade_id?: string
  cost_centre_id?: string
}

export type ChangeSalaryPayload = CreateSalaryPayload & {
  effective_date: string
  change_reason: string
  change_type: string
}
