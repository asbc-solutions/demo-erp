import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  AskPayload,
  AssistantAnswer,
  AssistantBriefing,
  AssistantConversation,
  AssistantDraft,
  AssistantSettings,
  AssistantSettingsPayload,
} from "../types/assistant"
import type {
  CashPosition,
  CloseReadiness,
  FinanceException,
  FinanceHome,
} from "../types/overview"

export const overviewApi = {
  home: () => httpClient.get<ApiResponse<FinanceHome>>("/finance/overview/home"),

  cashPosition: () => httpClient.get<ApiResponse<CashPosition>>("/finance/overview/cash-position"),

  closeReadiness: () =>
    httpClient.get<ApiResponse<CloseReadiness>>("/finance/overview/close-readiness"),

  exceptions: () => httpClient.get<ApiResponse<FinanceException[]>>("/finance/overview/exceptions"),

}

export const assistantApi = {
  settings: () => httpClient.get<ApiResponse<AssistantSettings>>("/finance/assistant/settings"),

  updateSettings: (payload: AssistantSettingsPayload) =>
    httpClient.put<ApiResponse<AssistantSettings>>("/finance/assistant/settings", payload),

  briefing: () => httpClient.get<ApiResponse<AssistantBriefing>>("/finance/assistant/briefing"),

  drafts: (status: string) =>
    httpClient.get<ApiResponse<AssistantDraft[]>>("/finance/assistant/drafts", {
      params: { status },
    }),

  history: () =>
    httpClient.get<ApiResponse<AssistantConversation[]>>("/finance/assistant/history"),

  ask: (payload: AskPayload) =>
    httpClient.post<ApiResponse<AssistantAnswer>>("/finance/assistant/ask", payload),
}
