"use client"

import { useQuery } from "@tanstack/react-query"
import { masterDataApi } from "../api/master-data"
import { salesKeys } from "../constants/query-keys"
import type { SalesMasterData } from "../types"

const ONE_HOUR = 60 * 60 * 1000

/** True once at least one lookup list has entries — an all-empty payload means unseeded data. */
function isSeeded(data: SalesMasterData | undefined) {
  if (!data) return false
  return Object.values(data).some((list) => list.length > 0)
}

/**
 * Backend caches this 1h server-side — mirror that with a long staleTime client-side.
 * An all-empty payload is never cached, so seeding the lookups server-side takes effect
 * on the next render instead of being masked for an hour.
 */
export function useSalesMasterData() {
  return useQuery({
    queryKey: salesKeys.masterData.get(),
    queryFn: () => masterDataApi.get().then((r) => r.data.data),
    staleTime: (query) => (isSeeded(query.state.data) ? ONE_HOUR : 0),
  })
}
