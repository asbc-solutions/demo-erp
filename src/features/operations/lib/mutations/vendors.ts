"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { vendorsApi } from "../api/vendors"
import { operationsKeys } from "../constants/query-keys"
import type { CreateVendorPayload, RenewVendorPayload } from "../types"

export function useCreateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVendorPayload) =>
      vendorsApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: operationsKeys.vendors.all }),
  })
}

export function useActivateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vendorsApi.activate(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: operationsKeys.vendors.all }),
  })
}

export function useRenewVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RenewVendorPayload }) =>
      vendorsApi.renew(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: operationsKeys.vendors.all }),
  })
}
