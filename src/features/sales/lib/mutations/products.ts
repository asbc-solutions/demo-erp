"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { productsApi } from "../api/products"
import { salesKeys } from "../constants/query-keys"
import type { AdjustStockPayload, CreateProductPayload, UpdateProductPayload } from "../types"

function assertValidUnitPrice(
  payload: CreateProductPayload | UpdateProductPayload,
  message: string,
) {
  if (payload.default_unit_price !== undefined && payload.default_unit_price <= 0) {
    throw {
      code: "validation_error",
      message,
      details: { fields: { default_unit_price: [message] } },
    }
  }
}

export function useCreateProduct() {
  const t = useTranslations("SalesProducts")
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => {
      assertValidUnitPrice(payload, t("unitPricePositive"))
      return productsApi.create(payload).then((r) => r.data.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.products.all }),
  })
}

export function useUpdateProduct() {
  const t = useTranslations("SalesProducts")
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) => {
      assertValidUnitPrice(payload, t("unitPricePositive"))
      return productsApi.update(id, payload).then((r) => r.data.data)
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: salesKeys.products.detail(id) })
      qc.invalidateQueries({ queryKey: salesKeys.products.all })
    },
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustStockPayload }) =>
      productsApi.adjustStock(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: salesKeys.products.detail(id) })
      qc.invalidateQueries({ queryKey: salesKeys.products.all })
    },
  })
}
