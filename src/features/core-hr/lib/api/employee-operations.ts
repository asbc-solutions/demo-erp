import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  EmployeeOperationListParams,
  EmployeeOperationPreview,
  EmployeeOperationResult,
  PromoteEmployeePayload,
  PromotePreview,
  TerminateEmployeePayload,
  TransferEmployeePayload,
} from "../types"

type DryRunResponse<T> = ApiResponse<T> & { dry_run: true }

export const employeeOperationsApi = {
  previewTransfer: (employeeId: string, payload: TransferEmployeePayload) =>
    httpClient.post<DryRunResponse<EmployeeOperationPreview>>(
      `/employees/${employeeId}/transfer/preview`,
      payload
    ),

  transfer: (employeeId: string, payload: TransferEmployeePayload) =>
    httpClient.put<ApiResponse<EmployeeOperationResult>>(
      `/employees/${employeeId}/transfer`,
      payload
    ),

  previewPromotion: (employeeId: string, payload: PromoteEmployeePayload) =>
    httpClient.post<DryRunResponse<PromotePreview>>(
      `/employees/${employeeId}/promote/preview`,
      payload
    ),

  promote: (employeeId: string, payload: PromoteEmployeePayload) =>
    httpClient.put<ApiResponse<EmployeeOperationResult>>(
      `/employees/${employeeId}/promote`,
      payload
    ),

  previewTermination: (
    employeeId: string,
    payload: TerminateEmployeePayload
  ) =>
    httpClient.post<DryRunResponse<EmployeeOperationPreview>>(
      `/employees/${employeeId}/terminate/preview`,
      payload
    ),

  terminate: (employeeId: string, payload: TerminateEmployeePayload) =>
    httpClient.post<ApiResponse<EmployeeOperationResult>>(
      `/employees/${employeeId}/terminate`,
      payload
    ),

  list: (params?: EmployeeOperationListParams) =>
    httpClient.get<
      ApiResponse<EmployeeOperationResult[]> & { meta: PaginationMeta }
    >("/operations", { params }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<EmployeeOperationResult>>(`/operations/${id}`),

  history: (employeeId: string) =>
    httpClient.get<ApiResponse<EmployeeOperationResult[]>>(
      `/employees/${employeeId}/operations`
    ),

  undo: (operationId: string) =>
    httpClient.post<{ success: boolean; message: string }>(
      `/operations/${operationId}/undo`
    ),
}
