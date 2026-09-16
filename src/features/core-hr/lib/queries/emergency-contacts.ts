"use client"

import { useQuery } from "@tanstack/react-query"
import { emergencyContactsApi } from "../api/emergency-contacts"
import { coreHrKeys } from "../constants/query-keys"
import type { EmergencyContactListParams } from "../types"

export function useEmergencyContacts(params?: EmergencyContactListParams) {
  return useQuery({
    queryKey: coreHrKeys.emergencyContacts.list(params),
    queryFn: () => emergencyContactsApi.list(params).then((r) => r.data),
  })
}

export function useEmployeeEmergencyContacts(employeeId: string) {
  return useQuery({
    queryKey: coreHrKeys.emergencyContacts.byEmployee(employeeId),
    queryFn: () =>
      emergencyContactsApi.byEmployee(employeeId).then((r) => r.data.data),
    enabled: !!employeeId,
  })
}
