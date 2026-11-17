import type { Messages, useTranslations } from "next-intl"

import type { CurrencyCode } from "../../../lib/types/common"

export type TaxTranslator = ReturnType<typeof useTranslations<"FinanceTax">>

type TaxMessages = Messages["FinanceTax"]
/** A flat (non-enum-map) key of the `FinanceTax` namespace. */
export type TaxMessageKey = {
  [K in keyof TaxMessages]: TaxMessages[K] extends string ? K : never
}[keyof TaxMessages]

export type VatReturnStatus = "draft" | "filed" | "settled"

export type VatBoxes = {
  total_sales: number
  taxable_sales: number
  output_vat: number
  zero_rated: number
  exempt: number
  total_purchases: number
  input_vat: number
  non_recoverable: number
  adjustments: number
}

export type VatCheck = { id: string; title: string; count: number; href: string; resolved: boolean; clear: boolean }

export type VatReturn = {
  id: string
  period: string
  start: string
  end: string
  due: string
  status: VatReturnStatus
  output_vat: number
  input_vat: number
  net: number
  boxes: VatBoxes
  acknowledgement: string | null
  filed_at: string | null
  filing_entry?: string | null
  settlement_entry: string | null
  checks: VatCheck[]
}

export type VatReturnTab = { id: string; period: string; end: string; status: VatReturnStatus }

export type WithholdingRow = {
  id: string
  bill: string
  supplier: string
  date: string
  gross: number
  code: string
  rate: number
  amount: number
  status: "certified" | "accrued"
  certificate: string | null
}

export type Withholding = { items: WithholdingRow[]; total: number; certified: number; certificates: number; pending: number }

export type EDocumentStatus = "valid" | "rejected" | "submitted" | "not_sent" | "cancel_requested" | "cancelled"

export type EDocumentError = { code: string; message: string; path: string; fixed: boolean }

export type EDocument = {
  id: string
  number: string
  authority: "ETA" | "ZATCA"
  type: "invoice" | "credit_note"
  buyer_id: string
  buyer_name: string
  issued: string
  total: number
  currency: CurrencyCode
  source_document: string
  status: EDocumentStatus
  attempts: number
  submission_uuid: string | null
  document_uuid: string | null
  long_id: string | null
  hash: string | null
  errors: EDocumentError[]
  open_errors: number
  history: { id: string; event: string; actor: string; date: string; note: string }[]
}

export type EInvoiceState = {
  total: number
  valid: number
  rejected: number
  not_sent: number
  submitted: number
  cancel_requested: number
  cancelled: number
  seal_expires: string
  seal_days: number
  items_total: number
  items_unmapped: number
}

export type EInvoiceConsole = {
  authority: "ETA" | "ZATCA"
  items: EDocument[]
  state: EInvoiceState
  authorities: { ETA: number; ZATCA: number }
  groups: { code: string; message: string; path: string; ids: string[]; value: number; bulk: boolean }[]
  unregistered_codes: string[]
}

export type Declaration = {
  id: string
  name: string
  authority: string
  period: string
  due: string
  filed_on: string | null
  href: string | null
  status: "filed" | "due" | "overdue" | "upcoming"
  days: number | null
  can_file: boolean
}

export type Declarations = { items: Declaration[]; due_now: number; filed_quarter: number; upcoming: number }

export type TaxCode = {
  id: string
  code: string
  name: string
  kind: string
  rate: number
  basis: string
  account_code: string | null
  account_name: string | null
  jurisdiction: string
  status: string
}

export type TaxCodes = { items: TaxCode[]; vat: number; withholding: number; other: number; jurisdictions: string[] }

export type NewTaxCodePayload = { code: string; name: string; kind: string; rate: number; account_code: string; jurisdiction: string }

export type AuditFile = {
  id: string
  name: string
  kind: string
  standard: string
  period: string
  generated_on: string | null
  status: "ready" | "generating"
  records: number | null
}

export type AuditFiles = {
  items: AuditFile[]
  ready: number
  records: number
  generating: number
  closed_periods: { id: string; label: string }[]
}
