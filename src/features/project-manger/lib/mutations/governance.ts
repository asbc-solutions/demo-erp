"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { governanceApi } from "../api/governance"
import { pmKeys } from "../constants/query-keys"
import type {
  ChangeRequestExecutionStatus,
  CreateChangeRequestPayload,
} from "../types"

/* ── Gates ───────────────────────────────────────────────────────────── */

/** submit / approve / reject / request-info on one of the project's gates. */
export function useGateAction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input:
      | { action: "submit"; gateId: string }
      | { action: "approve"; gateId: string; notes?: string }
      | { action: "reject"; gateId: string; reason: string }
      | { action: "request_info"; gateId: string; message: string },
    ) => {
      switch (input.action) {
        case "submit":
          return governanceApi.submitGate(input.gateId).then((r) => r.data.data)
        case "approve":
          return governanceApi
            .approveGate(input.gateId, input.notes)
            .then((r) => r.data.data)
        case "reject":
          return governanceApi
            .rejectGate(input.gateId, input.reason)
            .then((r) => r.data.data)
        case "request_info":
          return governanceApi
            .requestGateInfo(input.gateId, input.message)
            .then((r) => r.data.data)
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.governance.gates(projectId) }),
  })
}

/* ── Change requests ─────────────────────────────────────────────────── */

export function useCreateChangeRequest(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateChangeRequestPayload) =>
      governanceApi
        .createChangeRequest(projectId, payload)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.governance.changeRequests(projectId),
      }),
  })
}

export function useChangeRequestAction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input:
      | { action: "submit"; crId: string }
      | { action: "approve"; crId: string; notes?: string }
      | { action: "reject"; crId: string; reason: string }
      | {
          action: "set_status"
          crId: string
          status: ChangeRequestExecutionStatus
        },
    ) => {
      switch (input.action) {
        case "submit":
          return governanceApi
            .submitChangeRequest(input.crId)
            .then((r) => r.data.data)
        case "approve":
          return governanceApi
            .approveChangeRequest(input.crId, input.notes)
            .then((r) => r.data.data)
        case "reject":
          return governanceApi
            .rejectChangeRequest(input.crId, input.reason)
            .then((r) => r.data.data)
        case "set_status":
          return governanceApi
            .updateChangeRequestStatus(input.crId, input.status)
            .then((r) => r.data.data)
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.governance.changeRequests(projectId),
      }),
  })
}

/* ── Closure ─────────────────────────────────────────────────────────── */

export function useToggleClosureItem(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, isComplete }: { itemId: string; isComplete: boolean }) =>
      governanceApi.toggleClosureItem(itemId, isComplete).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.governance.closure(projectId) }),
  })
}

export function useSetTechnicallyComplete(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      governanceApi.setTechnicallyComplete(projectId).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.governance.closure(projectId) })
      qc.invalidateQueries({ queryKey: pmKeys.projects.detail(projectId) })
      qc.invalidateQueries({ queryKey: pmKeys.projects.all })
    },
  })
}

export function useLockProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      governanceApi.lockProject(projectId).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.governance.closure(projectId) })
      qc.invalidateQueries({ queryKey: pmKeys.projects.detail(projectId) })
      qc.invalidateQueries({ queryKey: pmKeys.projects.all })
    },
  })
}
