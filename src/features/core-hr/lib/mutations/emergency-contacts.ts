"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { emergencyContactsApi } from "../api/emergency-contacts"
import { coreHrKeys } from "../constants/query-keys"
import type {
  CreateEmergencyContactPayload,
  UpdateEmergencyContactPayload,
} from "../types"

export function useCreateEmergencyContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: CreateEmergencyContactPayload
    }) => emergencyContactsApi.create(employeeId, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.emergencyContacts.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.emergencyContacts.byEmployee(employeeId),
      })
    },
  })
}

export function useUpdateEmergencyContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      id,
      payload,
    }: {
      employeeId: string
      id: string
      payload: UpdateEmergencyContactPayload
    }) =>
      emergencyContactsApi.update(employeeId, id, payload).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.emergencyContacts.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.emergencyContacts.byEmployee(employeeId),
      })
    },
  })
}

export function useDeleteEmergencyContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, id }: { employeeId: string; id: string }) =>
      emergencyContactsApi.delete(employeeId, id),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.emergencyContacts.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.emergencyContacts.byEmployee(employeeId),
      })
    },
  })
}

export function useSetPrimaryEmergencyContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, id }: { employeeId: string; id: string }) =>
      emergencyContactsApi.setPrimary(employeeId, id).then((r) => r.data.data),
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.emergencyContacts.all })
      qc.invalidateQueries({
        queryKey: coreHrKeys.emergencyContacts.byEmployee(employeeId),
      })
    },
  })
}
