import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  ConnectIntegrationPayload,
  ConnectIntegrationResponse,
  DisconnectIntegrationResponse,
  Integration,
  IntegrationProvider,
  IntegrationsListMeta,
  RecordSyncPayload,
  RecordSyncResponse,
} from "../types/integration"

export const integrationsApi = {
  list: () =>
    httpClient.get<ApiResponse<Integration[]> & { meta: IntegrationsListMeta }>(
      "/integrations",
    ),

  connect: (provider: IntegrationProvider, payload?: ConnectIntegrationPayload) =>
    httpClient.post<ApiResponse<ConnectIntegrationResponse>>(
      `/integrations/${provider}/connect`,
      payload ?? {},
    ),

  disconnect: (provider: IntegrationProvider) =>
    httpClient.post<ApiResponse<DisconnectIntegrationResponse>>(
      `/integrations/${provider}/disconnect`,
    ),

  recordSync: (provider: IntegrationProvider, payload?: RecordSyncPayload) =>
    httpClient.post<ApiResponse<RecordSyncResponse>>(
      `/integrations/${provider}/sync`,
      payload ?? {},
    ),
}
