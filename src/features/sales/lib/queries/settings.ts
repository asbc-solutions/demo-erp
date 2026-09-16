"use client"

import { useQuery } from "@tanstack/react-query"
import { settingsApi } from "../api/settings"
import { salesKeys } from "../constants/query-keys"

export function useSalesSettings(branchId?: number) {
  return useQuery({
    queryKey: salesKeys.settings.get(branchId),
    queryFn: () => settingsApi.get(branchId).then((r) => r.data.data),
  })
}

/**
 * Advisory-only preview of the *next* number under the currently-saved
 * format (no lock, can drift under concurrency) — it does not take
 * unsaved/in-progress format edits as input (see docs/sales.md §4.7).
 */
export function useNumberingPreview() {
  return useQuery({
    queryKey: salesKeys.settings.numberingPreview(),
    queryFn: () => settingsApi.numberingPreview().then((r) => r.data.data),
  })
}
