import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  CompanyProfile,
  ResetDemoDataPayload,
  ResetDemoDataResult,
  UpdateCompanyProfilePayload,
  UpdateCompanyProfileResult,
} from "../types/company-profile"

export const companyProfileApi = {
  get: () =>
    httpClient.get<ApiResponse<CompanyProfile>>("/settings/company-profile"),

  update: (payload: UpdateCompanyProfilePayload) =>
    httpClient.put<ApiResponse<UpdateCompanyProfileResult>>(
      "/settings/company-profile",
      payload,
    ),

  /**
   * Destructive: wipes and reseeds the entire database, invalidates every
   * session including the caller's own. Requires `confirm: true` (any other
   * value = 422) and `settings.company` write. The backend independently
   * gates this behind an env flag + non-production check (403 either way if
   * unmet) — that can't be detected client-side.
   */
  resetDemoData: (payload: ResetDemoDataPayload) =>
    httpClient.post<ApiResponse<ResetDemoDataResult>>(
      "/settings/reset-demo-data",
      payload,
    ),
}
