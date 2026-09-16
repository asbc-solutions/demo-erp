"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "../api/settings"
import { salesKeys } from "../constants/query-keys"
import type { UpdateSalesSettingsPayload } from "../types"

export function useUpdateSalesSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateSalesSettingsPayload) =>
      settingsApi.update(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.settings.all })
    },
  })
}
