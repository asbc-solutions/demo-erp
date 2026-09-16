import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  Employee,
  EmployeeExportJob,
  EmployeeExportPayload,
  EmployeeListItem,
  EmployeeListMeta,
  EmployeeListParams,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  DirectReport,
  EmployeeOrgChart,
} from "../types"

export const employeesApi = {
  list: (params?: EmployeeListParams) =>
    httpClient.get<ApiResponse<EmployeeListItem[]> & { meta: EmployeeListMeta }>(
      "/employees",
      { params }
    ),

  getById: (id: string) =>
    httpClient.get<ApiResponse<Employee>>(`/employees/${id}`),

  create: (payload: CreateEmployeePayload) =>
    httpClient.post<ApiResponse<Employee>>("/employees", payload),

  update: (id: string, payload: UpdateEmployeePayload) =>
    httpClient.put<ApiResponse<Employee>>(`/employees/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/employees/${id}`),

  reactivate: (id: string) =>
    httpClient.post<ApiResponse<Employee>>(`/employees/${id}/reactivate`),

  directReports: (id: string) =>
    httpClient.get<ApiResponse<DirectReport[]>>(`/employees/${id}/direct-reports`),

  orgChart: (id: string) =>
    httpClient.get<ApiResponse<EmployeeOrgChart>>(`/employees/${id}/org-chart`),

  uploadPhoto: (id: string, file: File) => {
    const form = new FormData()
    form.append("photo", file)
    return httpClient.post<ApiResponse<{ photo_path: string }>>(
      `/employees/${id}/photo`,
      form,
      { headers: { "Content-Type": undefined } }
    )
  },

  removePhoto: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/employees/${id}/photo`),

  // 200 → binary file; 202 → JSON job envelope (still delivered as a Blob
  // because of responseType) — callers must branch on response.status.
  export: (payload: EmployeeExportPayload) =>
    httpClient.post<Blob>("/employees/export", payload, {
      responseType: "blob",
    }),

  exportStatus: (jobId: string) =>
    httpClient.get<ApiResponse<EmployeeExportJob>>(
      `/employees/export/${jobId}`,
    ),
}
