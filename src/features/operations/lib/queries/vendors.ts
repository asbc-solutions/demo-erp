"use client"

import { useQuery } from "@tanstack/react-query"
import { vendorsApi } from "../api/vendors"
import { operationsKeys } from "../constants/query-keys"
import type { VendorListParams } from "../types"

export function useVendors(params?: VendorListParams) {
  return useQuery({
    queryKey: operationsKeys.vendors.list(params),
    queryFn: () => vendorsApi.list(params).then((r) => r.data),
  })
}

export function useVendorKpis() {
  return useQuery({
    queryKey: operationsKeys.vendors.kpis(),
    queryFn: () => vendorsApi.kpis().then((r) => r.data.data),
  })
}
