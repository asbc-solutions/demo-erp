"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { companyProfileApi } from "../api/company-profile"
import { salesKeys } from "../constants/query-keys"
import type { UpdateCompanyProfilePayload } from "../types"

export function useUpdateCompanyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCompanyProfilePayload) =>
      companyProfileApi.update(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.companyProfile.all }),
  })
}

export function useUploadCompanyLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) =>
      companyProfileApi.uploadLogo(file).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.companyProfile.all })
      qc.invalidateQueries({ queryKey: salesKeys.settings.all })
    },
  })
}
