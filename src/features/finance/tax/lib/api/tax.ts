import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  AuditFile,
  AuditFiles,
  Declarations,
  EDocument,
  EInvoiceConsole,
  EInvoiceState,
  NewTaxCodePayload,
  TaxCode,
  TaxCodes,
  VatCheck,
  VatReturn,
  VatReturnTab,
  Withholding,
} from "../types/tax"

const vat = (id: string) => `/finance/tax/vat-returns/${id}`
const doc = (id: string) => `/finance/tax/e-invoicing/${id}`

export const taxApi = {
  vatReturns: () => httpClient.get<ApiResponse<VatReturnTab[]>>("/finance/tax/vat-returns"),
  vatReturn: (id: string) => httpClient.get<ApiResponse<VatReturn | null>>(vat(id)),
  resolveCheck: (id: string, check: string) => httpClient.post<ApiResponse<VatCheck[]>>(`${vat(id)}/checks/${check}/resolve`),
  fileReturn: (id: string) => httpClient.post<ApiResponse<VatReturn>>(`${vat(id)}/file`),
  settleReturn: (id: string, treasuryId: string) => httpClient.post<ApiResponse<VatReturn>>(`${vat(id)}/settle`, { treasury_id: treasuryId }),

  withholding: () => httpClient.get<ApiResponse<Withholding>>("/finance/tax/withholding"),
  issueCertificates: (billIds: string[]) =>
    httpClient.post<ApiResponse<{ issued: number }>>("/finance/tax/withholding/certificates", { bill_ids: billIds }),

  eInvoicing: (authority: string) => httpClient.get<ApiResponse<EInvoiceConsole>>("/finance/tax/e-invoicing", { params: { authority } }),
  eDocument: (id: string) => httpClient.get<ApiResponse<EDocument | null>>(doc(id)),
  submitBatch: () => httpClient.post<ApiResponse<{ sent: number; cleared: number }>>("/finance/tax/e-invoicing/submit-batch"),
  resubmitGroup: (code: string) =>
    httpClient.post<ApiResponse<{ sent: number; cleared: number }>>("/finance/tax/e-invoicing/resubmit-group", { code }),
  renewSeal: () => httpClient.post<ApiResponse<{ seal_expires: string }>>("/finance/tax/e-invoicing/renew-seal"),
  mapItems: () => httpClient.post<ApiResponse<EInvoiceState>>("/finance/tax/e-invoicing/map-items"),
  submitDocument: (id: string) => httpClient.post<ApiResponse<EDocument & { cleared: boolean }>>(`${doc(id)}/submit`),
  fixDocument: (id: string, code: string) => httpClient.post<ApiResponse<EDocument>>(`${doc(id)}/fix`, { code }),
  cancelDocument: (id: string, reason: string) => httpClient.post<ApiResponse<EDocument>>(`${doc(id)}/cancel`, { reason }),
  refreshDocument: (id: string) => httpClient.post<ApiResponse<EDocument>>(`${doc(id)}/refresh`),

  declarations: () => httpClient.get<ApiResponse<Declarations>>("/finance/tax/declarations"),
  fileDeclaration: (id: string) => httpClient.post<ApiResponse<{ filed_on: string }>>(`/finance/tax/declarations/${id}/file`),

  codes: () => httpClient.get<ApiResponse<TaxCodes>>("/finance/tax/codes"),
  createCode: (payload: NewTaxCodePayload) => httpClient.post<ApiResponse<TaxCode>>("/finance/tax/codes", payload),

  auditFiles: () => httpClient.get<ApiResponse<AuditFiles>>("/finance/tax/audit-files"),
  generateAuditFile: (kind: string, period: string) => httpClient.post<ApiResponse<AuditFile>>("/finance/tax/audit-files", { kind, period }),
  exportAuditFile: (id: string) =>
    httpClient.get<ApiResponse<{ name: string; headers: string[]; rows: unknown[][] }>>(`/finance/tax/audit-files/${id}/export`),
}
