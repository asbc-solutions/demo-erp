import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { NumberingPreview, SalesSettings, UpdateSalesSettingsPayload } from "../types"

export const settingsApi = {
  get: (branchId?: number) =>
    httpClient.get<ApiResponse<SalesSettings>>("/sales/settings", {
      params: branchId ? { branch_id: branchId } : undefined,
    }),

  update: (payload: UpdateSalesSettingsPayload) =>
    httpClient.put<ApiResponse<SalesSettings>>("/sales/settings", payload),

  numberingPreview: () =>
    httpClient.get<ApiResponse<NumberingPreview>>("/sales/settings/numbering-preview"),
}
