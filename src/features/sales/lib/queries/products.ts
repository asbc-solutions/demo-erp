"use client"

import { useQuery } from "@tanstack/react-query"
import { productsApi } from "../api/products"
import { salesKeys } from "../constants/query-keys"
import type { ProductListParams } from "../types"

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: salesKeys.products.list(params),
    queryFn: () => productsApi.list(params).then((r) => r.data),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: salesKeys.products.detail(id),
    queryFn: () => productsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

/** Backs the line-item product picker on Quotations/Orders. Empty `q` short-circuits to `[]` (mirrors backend: no full-table-scan on blank search). */
export function useProductSearch(q: string) {
  return useQuery({
    queryKey: salesKeys.products.search({ q }),
    queryFn: () => productsApi.search({ q }).then((r) => r.data.data),
    enabled: q.trim().length > 0,
  })
}
