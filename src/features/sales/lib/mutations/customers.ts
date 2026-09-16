"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customersApi } from "../api/customers"
import { salesKeys } from "../constants/query-keys"
import { resolveExportDownloadUrl } from "../utils/export-job"
import type {
  BlockCustomerPayload,
  CreateCustomerPayload,
  CustomerExportFilters,
  UpdateCustomerPayload,
} from "../types"
import type { SalesExportRequest } from "../types/common"

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) =>
      customersApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.customers.all }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      customersApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: salesKeys.customers.detail(id) })
      qc.invalidateQueries({ queryKey: salesKeys.customers.all })
    },
  })
}

export function useBlockCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BlockCustomerPayload }) =>
      customersApi.block(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.customers.all }),
  })
}

export function useUnblockCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customersApi.unblock(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.customers.all }),
  })
}

export function useDeactivateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customersApi.deactivate(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.customers.all }),
  })
}

export function useExportCustomers() {
  return useMutation({
    mutationFn: async (payload: SalesExportRequest<CustomerExportFilters>) => {
      const result = await customersApi.export(payload).then((r) => r.data.data)
      return resolveExportDownloadUrl(result)
    },
  })
}
