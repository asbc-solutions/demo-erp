import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  ApprovalPolicy,
  ApprovalPolicyList,
  FinanceRole,
  FiscalCalendar,
  NewPolicyInput,
  NewRoleInput,
  NumberingRow,
  PostingMap,
  PostingRule,
  RoleList,
  SetupInput,
  SetupSummary,
  Simulation,
  StageInput,
} from "../types/configuration"

export const configurationApi = {
  setup: () => httpClient.get<ApiResponse<SetupSummary>>("/finance/setup"),

  completeSetup: (input: SetupInput) => httpClient.post<ApiResponse<SetupSummary>>("/finance/setup", input),

  postingMap: () => httpClient.get<ApiResponse<PostingMap>>("/finance/settings/posting-map"),

  stageRule: (id: string, input: StageInput) =>
    httpClient.post<ApiResponse<PostingRule>>(`/finance/settings/posting-map/rules/${id}/stage`, input),

  discardStaged: () => httpClient.post<ApiResponse<PostingMap>>("/finance/settings/posting-map/discard"),

  publishMap: () => httpClient.post<ApiResponse<PostingMap & { published: number }>>("/finance/settings/posting-map/publish"),

  simulate: (input: { rule_id: string; amount: number; inclusive: boolean }) =>
    httpClient.post<ApiResponse<Simulation>>("/finance/settings/posting-map/simulate", input),

  fiscalCalendar: () => httpClient.get<ApiResponse<FiscalCalendar>>("/finance/settings/fiscal-calendar"),

  saveFiscalCalendar: (input: { year_start_month: number; adjusting_days: number }) =>
    httpClient.post<ApiResponse<FiscalCalendar>>("/finance/settings/fiscal-calendar", input),

  numbering: () => httpClient.get<ApiResponse<NumberingRow[]>>("/finance/settings/numbering"),

  approvals: () => httpClient.get<ApiResponse<ApprovalPolicyList>>("/finance/settings/approvals"),

  createPolicy: (input: NewPolicyInput) => httpClient.post<ApiResponse<ApprovalPolicy>>("/finance/settings/approvals", input),

  roles: () => httpClient.get<ApiResponse<RoleList>>("/finance/settings/roles"),

  setPersona: (persona: string) => httpClient.post<ApiResponse<{ code: string }>>("/finance/settings/roles/persona", { persona }),

  createRole: (input: NewRoleInput) => httpClient.post<ApiResponse<FinanceRole>>("/finance/settings/roles", input),
}
