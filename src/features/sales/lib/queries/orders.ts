"use client"

import { useQuery } from "@tanstack/react-query"
import { ordersApi } from "../api/orders"
import { salesKeys } from "../constants/query-keys"
import type { OrderListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useOrders(params?: OrderListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: salesKeys.orders.list(params),
    queryFn: () => ordersApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: salesKeys.orders.detail(id),
    queryFn: () => ordersApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
