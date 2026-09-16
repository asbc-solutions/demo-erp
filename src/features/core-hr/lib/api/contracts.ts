import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  ContractDocumentDownloadResponse,
  ContractDocumentUploadResponse,
  ContractListItem,
  ContractListParams,
  CreateContractPayload,
  CurrentContract,
  ExpiringContractsMeta,
  RenewContractPayload,
  RenewContractResponse,
} from "../types"

type ContractListResponse = Omit<ApiResponse<ContractListItem[]>, "meta"> & {
  meta: PaginationMeta
}

type ExpiringContractsResponse = Omit<
  ApiResponse<ContractListItem[]>,
  "meta"
> & {
  meta: ExpiringContractsMeta
}

export const contractsApi = {
  list: (params?: ContractListParams) =>
    httpClient.get<ContractListResponse>("/contracts", { params }),

  expiring: (days = 90) =>
    httpClient.get<ExpiringContractsResponse>("/contracts/expiring", {
      params: { days },
    }),

  byEmployee: (employeeId: string) =>
    httpClient.get<ApiResponse<ContractListItem[]>>(
      `/employees/${employeeId}/contracts`
    ),

  currentByEmployee: (employeeId: string) =>
    httpClient.get<ApiResponse<CurrentContract>>(
      `/employees/${employeeId}/contracts/current`
    ),

  create: (employeeId: string, payload: CreateContractPayload) =>
    httpClient.post<ApiResponse<ContractListItem>>(
      `/employees/${employeeId}/contracts`,
      payload
    ),

  renew: (employeeId: string, payload: RenewContractPayload) =>
    httpClient.post<ApiResponse<RenewContractResponse>>(
      `/employees/${employeeId}/contracts/renew`,
      payload
    ),

  uploadDocument: (employeeId: string, contractId: string, file: File) => {
    const form = new FormData()
    form.append("document", file)
    return httpClient.post<ApiResponse<ContractDocumentUploadResponse>>(
      `/employees/${employeeId}/contracts/${contractId}/upload`,
      form,
      { headers: { "Content-Type": undefined } }
    )
  },

  downloadDocument: (employeeId: string, contractId: string) =>
    httpClient.get<ApiResponse<ContractDocumentDownloadResponse>>(
      `/employees/${employeeId}/contracts/${contractId}/download`
    ),
}
