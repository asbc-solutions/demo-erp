import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  EmergencyContact,
  EmergencyContactListParams,
  CreateEmergencyContactPayload,
  UpdateEmergencyContactPayload,
} from "../types"

type EmergencyContactListResponse = Omit<ApiResponse<EmergencyContact[]>, "meta"> & {
  meta: PaginationMeta
}

export const emergencyContactsApi = {
  list: (params?: EmergencyContactListParams) =>
    httpClient.get<EmergencyContactListResponse>("/emergency-contacts", { params }),

  byEmployee: (employeeId: string) =>
    httpClient.get<ApiResponse<EmergencyContact[]>>(
      `/employees/${employeeId}/emergency-contacts`
    ),

  create: (employeeId: string, payload: CreateEmergencyContactPayload) =>
    httpClient.post<ApiResponse<EmergencyContact>>(
      `/employees/${employeeId}/emergency-contacts`,
      payload
    ),

  update: (employeeId: string, id: string, payload: UpdateEmergencyContactPayload) =>
    httpClient.put<ApiResponse<EmergencyContact>>(
      `/employees/${employeeId}/emergency-contacts/${id}`,
      payload
    ),

  delete: (employeeId: string, id: string) =>
    httpClient.delete<ApiResponse<null>>(
      `/employees/${employeeId}/emergency-contacts/${id}`
    ),

  setPrimary: (employeeId: string, id: string) =>
    httpClient.put<ApiResponse<EmergencyContact>>(
      `/employees/${employeeId}/emergency-contacts/${id}/set-primary`,
      {}
    ),
}
