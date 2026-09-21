import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  BankingOverview,
  Cheque,
  ChequeBook,
  ChequeDirection,
  ChequeRegister,
  CustodyHolder,
  CustodyList,
  Employee,
  NewChequeBookPayload,
  NewChequePayload,
  NewCustodyPayload,
  NewTransferPayload,
  ReconciliationWorkspace,
  SettleCustodyPayload,
  StatementImport,
  Transfer,
  TreasuryDetail,
} from "../types/banking"

const reconciliation = (treasuryId: string) => `/finance/reconciliation/${treasuryId}`

export const bankingApi = {
  overview: () => httpClient.get<ApiResponse<BankingOverview>>("/finance/banking/overview"),

  treasury: (id: string) => httpClient.get<ApiResponse<TreasuryDetail | null>>(`/finance/treasuries/${id}`),

  workspace: (treasuryId: string) =>
    httpClient.get<ApiResponse<ReconciliationWorkspace | null>>(reconciliation(treasuryId)),

  matchPair: (treasuryId: string, lineId: string, entryId: string) =>
    httpClient.post<ApiResponse<ReconciliationWorkspace>>(`${reconciliation(treasuryId)}/match`, {
      line_id: lineId,
      entry_id: entryId,
    }),

  acceptAll: (treasuryId: string, min: number) =>
    httpClient.post<ApiResponse<{ accepted: number }>>(`${reconciliation(treasuryId)}/accept-all`, { min }),

  dismiss: (treasuryId: string, lineId: string, entryId: string) =>
    httpClient.post<ApiResponse<{ dismissed: boolean }>>(`${reconciliation(treasuryId)}/dismiss`, {
      line_id: lineId,
      entry_id: entryId,
    }),

  unmatch: (treasuryId: string, lineId: string) =>
    httpClient.post<ApiResponse<{ unmatched: boolean }>>(`${reconciliation(treasuryId)}/unmatch`, { line_id: lineId }),

  createEntry: (treasuryId: string, lineId: string, counterAccount: string) =>
    httpClient.post<ApiResponse<{ entry: string; counter_account: string }>>(
      `${reconciliation(treasuryId)}/lines/${lineId}/entry`,
      { counter_account: counterAccount },
    ),

  finish: (treasuryId: string) =>
    httpClient.post<ApiResponse<{ reconciled_lines: number; last_reconciled: string }>>(
      `${reconciliation(treasuryId)}/finish`,
    ),

  latestImport: (treasuryId: string) =>
    httpClient.get<ApiResponse<StatementImport | null>>("/finance/reconciliation/imports/latest", {
      params: { treasury_id: treasuryId },
    }),

  importStatement: (treasuryId: string) =>
    httpClient.post<ApiResponse<StatementImport>>("/finance/reconciliation/imports", { treasury_id: treasuryId }),

  transfers: () => httpClient.get<ApiResponse<Transfer[]>>("/finance/transfers"),

  createTransfer: (payload: NewTransferPayload) =>
    httpClient.post<ApiResponse<Transfer>>("/finance/transfers", payload),

  cheques: (direction: ChequeDirection) =>
    httpClient.get<ApiResponse<ChequeRegister>>("/finance/cheques", { params: { direction } }),

  cheque: (id: string) => httpClient.get<ApiResponse<Cheque | null>>(`/finance/cheques/${id}`),

  createCheque: (payload: NewChequePayload) => httpClient.post<ApiResponse<Cheque>>("/finance/cheques", payload),

  moveCheque: (id: string, status: string) =>
    httpClient.post<ApiResponse<Cheque>>(`/finance/cheques/${id}/status`, { status }),

  chequeBooks: () => httpClient.get<ApiResponse<ChequeBook[]>>("/finance/cheques/books"),

  createChequeBook: (payload: NewChequeBookPayload) =>
    httpClient.post<ApiResponse<ChequeBook>>("/finance/cheques/books", payload),

  employees: () => httpClient.get<ApiResponse<Employee[]>>("/finance/employees"),

  custody: () => httpClient.get<ApiResponse<CustodyList>>("/finance/custody"),

  custodyHolder: (id: string) => httpClient.get<ApiResponse<CustodyHolder | null>>(`/finance/custody/${id}`),

  createCustody: (payload: NewCustodyPayload) =>
    httpClient.post<ApiResponse<CustodyHolder>>("/finance/custody", payload),

  settleCustody: (id: string, payload: SettleCustodyPayload) =>
    httpClient.post<ApiResponse<CustodyHolder>>(`/finance/custody/${id}/settle`, payload),

  writeOffCustody: (id: string, reason: string) =>
    httpClient.post<ApiResponse<CustodyHolder>>(`/finance/custody/${id}/write-off`, { reason }),
}
