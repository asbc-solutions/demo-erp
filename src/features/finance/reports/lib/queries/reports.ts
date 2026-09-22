"use client"

import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "../api/reports"
import { reportsKeys } from "../constants/query-keys"

export function useTrialBalance() {
  return useQuery({ queryKey: reportsKeys.trialBalance(), queryFn: () => reportsApi.trialBalance().then((r) => r.data.data) })
}

export function useAuditLog() {
  return useQuery({ queryKey: reportsKeys.auditLog(), queryFn: () => reportsApi.auditLog().then((r) => r.data.data) })
}
