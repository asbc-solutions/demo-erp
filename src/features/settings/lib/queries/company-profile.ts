"use client"

import { useQuery } from "@tanstack/react-query"

import { companyProfileApi } from "../api/company-profile"
import { settingsKeys } from "../constants/query-keys"

export function useCompanyProfile() {
  return useQuery({
    queryKey: settingsKeys.companyProfile.detail(),
    queryFn: () => companyProfileApi.get().then((r) => r.data.data),
  })
}
