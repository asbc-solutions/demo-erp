"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { termsTemplatesApi } from "../api/terms-templates"
import { salesKeys } from "../constants/query-keys"
import type { CreateTermsTemplatePayload, UpdateTermsTemplatePayload } from "../types"

export function useCreateTermsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTermsTemplatePayload) =>
      termsTemplatesApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.termsTemplates.all }),
  })
}

export function useUpdateTermsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTermsTemplatePayload }) =>
      termsTemplatesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.termsTemplates.all }),
  })
}

export function useDeleteTermsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => termsTemplatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.termsTemplates.all }),
  })
}
