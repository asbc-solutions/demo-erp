import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { CompanyProfile, UpdateCompanyProfilePayload } from "../types"
import type { SignedDownloadUrl } from "../types/common"

export const companyProfileApi = {
  get: () => httpClient.get<ApiResponse<CompanyProfile>>("/sales/company-profile"),

  update: (payload: UpdateCompanyProfilePayload) =>
    httpClient.put<ApiResponse<CompanyProfile>>("/sales/company-profile", payload),

  uploadLogo: (file: File) => {
    const form = new FormData()
    form.append("logo", file)
    return httpClient.post<ApiResponse<CompanyProfile>>(
      "/sales/company-profile/logo",
      form,
      { headers: { "Content-Type": undefined } },
    )
  },

  getLogoDownloadUrl: () =>
    httpClient.get<ApiResponse<SignedDownloadUrl>>("/sales/company-profile/logo-url"),
}
