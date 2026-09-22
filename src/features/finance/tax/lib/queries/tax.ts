"use client"

import { useQuery } from "@tanstack/react-query"

import { taxApi } from "../api/tax"
import { taxKeys } from "../constants/query-keys"

export function useVatReturns() {
  return useQuery({ queryKey: taxKeys.vatReturns(), queryFn: () => taxApi.vatReturns().then((r) => r.data.data) })
}

export function useVatReturn(id: string) {
  return useQuery({ queryKey: taxKeys.vatReturn(id), queryFn: () => taxApi.vatReturn(id).then((r) => r.data.data), enabled: Boolean(id) })
}

export function useWithholding() {
  return useQuery({ queryKey: taxKeys.withholding(), queryFn: () => taxApi.withholding().then((r) => r.data.data) })
}

export function useEInvoicing(authority: string) {
  return useQuery({ queryKey: taxKeys.eInvoicing(authority), queryFn: () => taxApi.eInvoicing(authority).then((r) => r.data.data) })
}

export function useEDocument(id: string) {
  return useQuery({ queryKey: taxKeys.eDocument(id), queryFn: () => taxApi.eDocument(id).then((r) => r.data.data) })
}

export function useDeclarations() {
  return useQuery({ queryKey: taxKeys.declarations(), queryFn: () => taxApi.declarations().then((r) => r.data.data) })
}

export function useTaxCodes() {
  return useQuery({ queryKey: taxKeys.codes(), queryFn: () => taxApi.codes().then((r) => r.data.data) })
}

export function useAuditFiles() {
  return useQuery({ queryKey: taxKeys.auditFiles(), queryFn: () => taxApi.auditFiles().then((r) => r.data.data) })
}
