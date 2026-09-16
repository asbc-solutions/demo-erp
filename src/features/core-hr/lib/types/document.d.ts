export type DocumentStatus = "VERIFIED" | "PENDING" | "REJECTED"

export type EmployeeDocument = {
  id: string
  employee_id: string
  document_type: string
  document_type_label: string
  document_category: string
  document_title: string
  document_number: string | null
  issuing_authority: string | null
  issuing_country: string | null
  issue_date: string | null
  expiry_date: string | null
  expiry_label: string | null
  days_until_expiry: number | null
  is_expired: boolean
  is_verified: boolean
  is_mandatory: boolean
  has_file: boolean
  status_label: DocumentStatus
  alert_days_before: number | null
  verification?: {
    verified_by: string | null
    verified_date: string | null
    verification_notes: string | null
  }
}

export type DocumentListParams = {
  page?: number
  per_page?: number
  employee_id?: string
  document_type?: string
  document_category?: string
  is_verified?: boolean
  is_mandatory?: boolean
}

export type ExpiringDocumentsParams = {
  days?: number
  employee_id?: string
  document_category?: string
}

export type ExpiringDocumentsMeta = {
  days_threshold: number
  count: number
}

export type CreateDocumentPayload = {
  document_type: string
  document_category: string
  document_title: string
  document_number?: string
  issuing_authority?: string
  issuing_country?: string
  issue_date?: string
  expiry_date?: string
  alert_days_before?: number
  is_mandatory?: boolean
  document?: File
}

export type UpdateDocumentPayload = {
  document_title?: string
  expiry_date?: string
  is_mandatory?: boolean
  alert_days_before?: number
}

export type VerifyDocumentPayload = {
  verification_notes?: string
}

export type DocumentDownloadResponse = {
  download_url: string
}
