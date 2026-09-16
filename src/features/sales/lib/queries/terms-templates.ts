"use client"

import { useQuery } from "@tanstack/react-query"
import { termsTemplatesApi } from "../api/terms-templates"
import { salesKeys } from "../constants/query-keys"

export function useTermsTemplates() {
  return useQuery({
    queryKey: salesKeys.termsTemplates.list(),
    queryFn: () => termsTemplatesApi.list().then((r) => r.data.data),
  })
}
