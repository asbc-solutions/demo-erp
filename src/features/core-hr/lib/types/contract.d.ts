import type { EmployeeListItem } from "./employee"

export type ContractType =
  | "permanent"
  | "fixed_term"
  | "temporary"
  | "internship"
  | "contract"
  | "seasonal"
  | "secondment"

export type ContractStatus =
  | "draft"
  | "active"
  | "expired"
  | "terminated"
  | "renewed"
  | "suspended"

export type NoticePeriodUnit = "day" | "week" | "month"

export type ContractListItem = {
  id: string
  employee_id: string
  contract_number: string
  contract_type: ContractType
  contract_type_label: string
  contract_status: ContractStatus
  is_current: boolean
  start_date: string
  end_date: string | null
  days_remaining: number | null
  days_remaining_label: string
  renewal_count: number
  notice_period_days?: number | null
  notice_period_unit?: NoticePeriodUnit | null
  employee?: Pick<EmployeeListItem, "id" | "employee_number" | "full_name">
  employee_name?: string
  employee_number?: string
}

export type CurrentContract = ContractListItem & {
  is_open_ended: boolean
  dates: {
    start_date: string
    end_date: string | null
    probation_end_date: string | null
    approved_date: string | null
  }
  work: {
    work_location: string | null
    work_schedule: string | null
    weekly_hours: number | null
  }
  probation: {
    probation_days: number | null
    probation_end_date: string | null
  }
  notice: {
    notice_period_days: number | null
    notice_period_unit: NoticePeriodUnit | null
  }
  renewal: {
    renewal_type: string | null
    renewal_count: number
  }
}

export type ContractListParams = {
  page?: number
  per_page?: number
  employee_id?: string
  contract_status?: ContractStatus
  contract_type?: ContractType
  is_current?: boolean
  expiry_days?: number
}

export type ExpiringContractsMeta = {
  days_threshold: number
  count: number
}

export type CreateContractPayload = {
  contract_type: ContractType
  start_date: string
  end_date?: string | null
  is_open_ended: boolean
  work_location?: string | null
  work_schedule?: string | null
  weekly_hours?: number | null
  probation_days?: number | null
  notice_period_days?: number | null
  notice_period_unit?: NoticePeriodUnit | null
}

export type RenewContractPayload = CreateContractPayload

export type RenewContractResponse = {
  contract: ContractListItem
  previous_contract_summary: Pick<
    ContractListItem,
    | "contract_number"
    | "contract_type"
    | "contract_type_label"
    | "start_date"
    | "end_date"
  >
}

export type ContractDocumentUploadResponse = {
  file_path: string
  download_url: string
}

export type ContractDocumentDownloadResponse = {
  download_url: string
}
