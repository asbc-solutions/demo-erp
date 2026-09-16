"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { contractsApi } from "../api/contracts"
import { coreHrKeys } from "../constants/query-keys"
import type { CreateContractPayload, RenewContractPayload } from "../types"

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: CreateContractPayload
    }) => contractsApi.create(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.contracts.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.contracts.byEmployee(employeeId),
      })
      qc.invalidateQueries({
        queryKey: coreHrKeys.contracts.currentByEmployee(employeeId),
      })
    },
  })
}

export function useRenewContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: RenewContractPayload
    }) => contractsApi.renew(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.contracts.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.contracts.byEmployee(employeeId),
      })
      qc.invalidateQueries({
        queryKey: coreHrKeys.contracts.currentByEmployee(employeeId),
      })
    },
  })
}

export function useUploadContractDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      contractId,
      file,
    }: {
      employeeId: string
      contractId: string
      file: File
    }) =>
      contractsApi
        .uploadDocument(employeeId, contractId, file)
        .then((r) => r.data.data),
    onSuccess: (_, { employeeId, contractId }) => {
      qc.invalidateQueries({
        queryKey: coreHrKeys.contracts.document(employeeId, contractId),
      })
    },
  })
}
