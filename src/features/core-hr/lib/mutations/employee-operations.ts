"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { employeeOperationsApi } from "../api/employee-operations"
import { coreHrKeys } from "../constants/query-keys"
import type {
  PromoteEmployeePayload,
  TerminateEmployeePayload,
  TransferEmployeePayload,
} from "../types"

function invalidateEmployeeOperationImpact(
  qc: ReturnType<typeof useQueryClient>,
  employeeId: string
) {
  qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(employeeId) })
  qc.invalidateQueries({ queryKey: coreHrKeys.employees.all })
  qc.invalidateQueries({ queryKey: coreHrKeys.positions.all })
  qc.invalidateQueries({ queryKey: coreHrKeys.salaries.all })
  qc.invalidateQueries({ queryKey: coreHrKeys.contracts.all })
}

export function usePreviewEmployeeTransfer() {
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: TransferEmployeePayload
    }) =>
      employeeOperationsApi
        .previewTransfer(employeeId, payload)
        .then((r) => r.data.data),
  })
}

export function useTransferEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: TransferEmployeePayload
    }) =>
      employeeOperationsApi
        .transfer(employeeId, payload)
        .then((r) => r.data.data),
    onSuccess: (_, { employeeId }) =>
      invalidateEmployeeOperationImpact(qc, employeeId),
  })
}

export function usePreviewEmployeePromotion() {
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: PromoteEmployeePayload
    }) =>
      employeeOperationsApi
        .previewPromotion(employeeId, payload)
        .then((r) => r.data.data),
  })
}

export function usePromoteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: PromoteEmployeePayload
    }) =>
      employeeOperationsApi
        .promote(employeeId, payload)
        .then((r) => r.data.data),
    onSuccess: (_, { employeeId }) =>
      invalidateEmployeeOperationImpact(qc, employeeId),
  })
}

export function usePreviewEmployeeTermination() {
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: TerminateEmployeePayload
    }) =>
      employeeOperationsApi
        .previewTermination(employeeId, payload)
        .then((r) => r.data.data),
  })
}

export function useTerminateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string
      payload: TerminateEmployeePayload
    }) =>
      employeeOperationsApi
        .terminate(employeeId, payload)
        .then((r) => r.data.data),
    onSuccess: (_, { employeeId }) =>
      invalidateEmployeeOperationImpact(qc, employeeId),
  })
}

export function useUndoOperation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      operationId,
    }: {
      operationId: string
      employeeId: string
    }) => employeeOperationsApi.undo(operationId).then((r) => r.data),
    onSuccess: (_, { employeeId }) =>
      invalidateEmployeeOperationImpact(qc, employeeId),
  })
}
