"use client"

import { useQuery } from "@tanstack/react-query"
import { companyProfileApi } from "../api/company-profile"
import { salesKeys } from "../constants/query-keys"

export function useCompanyProfile() {
  return useQuery({
    queryKey: salesKeys.companyProfile.all,
    queryFn: () => companyProfileApi.get().then((r) => r.data.data),
  })
}

/** Only fetch once `has_logo` is known true — GET .../logo-url 404s otherwise. */
export function useCompanyLogoUrl(enabled: boolean) {
  return useQuery({
    queryKey: salesKeys.companyProfile.logoUrl(),
    queryFn: () => companyProfileApi.getLogoDownloadUrl().then((r) => r.data.data.download_url),
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}
