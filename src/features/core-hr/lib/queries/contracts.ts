"use client"

import { useQuery } from "@tanstack/react-query"
import { contractsApi } from "../api/contracts"
import { coreHrKeys } from "../constants/query-keys"
import type { ContractListParams } from "../types"

export function useContracts(params?: ContractListParams) {
  return useQuery({
    queryKey: coreHrKeys.contracts.list(params),
    queryFn: () => contractsApi.list(params).then((r) => r.data),
  })
}

export function useExpiringContracts(days = 90) {
  return useQuery({
    queryKey: coreHrKeys.contracts.expiring(days),
    queryFn: () => contractsApi.expiring(days).then((r) => r.data),
  })
}

export function useEmployeeContracts(employeeId: string) {
  return useQuery({
    queryKey: coreHrKeys.contracts.byEmployee(employeeId),
    queryFn: () => contractsApi.byEmployee(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}

export function useCurrentEmployeeContract(employeeId: string) {
  return useQuery({
    queryKey: coreHrKeys.contracts.currentByEmployee(employeeId),
    queryFn: () =>
      contractsApi.currentByEmployee(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}

export function useContractDownloadUrl(employeeId: string, contractId: string) {
  return useQuery({
    queryKey: coreHrKeys.contracts.document(employeeId, contractId),
    queryFn: () =>
      contractsApi.downloadDocument(employeeId, contractId).then((r) => r.data.data),
    enabled: !!employeeId && !!contractId,
  })
}
