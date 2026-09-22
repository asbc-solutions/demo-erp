import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  CurrencyList,
  FxRevaluation,
  GeneralLedger,
  ImportKind,
  JournalDetail,
  JournalFilters,
  JournalList,
  JournalTemplate,
  LedgerAccount,
  NewJournalPayload,
  NewRecurringPayload,
  NewTemplatePayload,
  OpeningBalances,
  RecurringJournal,
  RecurringList,
} from "../types/ledger"

export const ledgerApi = {
  accounts: () => httpClient.get<ApiResponse<LedgerAccount[]>>("/finance/ledger/accounts"),

  generalLedger: (params: { account?: string; contact?: string }) =>
    httpClient.get<ApiResponse<GeneralLedger | null>>("/finance/ledger", { params }),

  journals: (filters: JournalFilters) => httpClient.get<ApiResponse<JournalList>>("/finance/journals", { params: filters }),

  journal: (id: string) => httpClient.get<ApiResponse<JournalDetail | null>>(`/finance/journals/${id}`),

  createJournal: (payload: NewJournalPayload) => httpClient.post<ApiResponse<JournalDetail>>("/finance/journals", payload),

  journalAction: (id: string, action: "submit" | "post" | "send-back", reason?: string) =>
    httpClient.post<ApiResponse<JournalDetail>>(`/finance/journals/${id}/${action}`, { reason }),

  reverse: (id: string, date: string, reason: string) =>
    httpClient.post<ApiResponse<JournalDetail>>(`/finance/journals/${id}/reverse`, { date, reason }),

  templates: () => httpClient.get<ApiResponse<JournalTemplate[]>>("/finance/ledger/templates"),

  createTemplate: (payload: NewTemplatePayload) =>
    httpClient.post<ApiResponse<JournalTemplate>>("/finance/ledger/templates", payload),

  recurring: () => httpClient.get<ApiResponse<RecurringList>>("/finance/ledger/recurring"),

  createRecurring: (payload: NewRecurringPayload) =>
    httpClient.post<ApiResponse<RecurringJournal>>("/finance/ledger/recurring", payload),

  toggleRecurring: (id: string) => httpClient.post<ApiResponse<RecurringJournal>>(`/finance/ledger/recurring/${id}/toggle`),

  runRecurring: (id: string) =>
    httpClient.post<ApiResponse<{ journal: string; next_run: string }>>(`/finance/ledger/recurring/${id}/run`),

  openingBalances: () => httpClient.get<ApiResponse<OpeningBalances>>("/finance/ledger/opening-balances"),

  lockOpenings: () => httpClient.post<ApiResponse<{ locked: boolean }>>("/finance/ledger/opening-balances/lock"),

  currencies: () => httpClient.get<ApiResponse<CurrencyList>>("/finance/currencies"),

  refreshRates: () => httpClient.post<ApiResponse<{ refreshed_at: string }>>("/finance/currencies/refresh"),

  fxRevaluation: () => httpClient.get<ApiResponse<FxRevaluation>>("/finance/ledger/fx-revaluation"),

  postRevaluation: () => httpClient.post<ApiResponse<{ journal: string; net: number }>>("/finance/ledger/fx-revaluation"),

  importRows: (kind: ImportKind, rows: Record<string, string>[]) =>
    httpClient.post<ApiResponse<{ created: number; skipped: number }>>("/finance/ledger/import", { kind, rows }),
}
