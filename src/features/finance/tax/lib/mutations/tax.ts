"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { taxApi } from "../api/tax"
import type { NewTaxCodePayload } from "../types/tax"

export function useResolveVatCheck(returnId: string) {
  return useFinanceMutation((check: string) => taxApi.resolveCheck(returnId, check).then(unwrap))
}

export function useFileVatReturn() {
  return useFinanceMutation((id: string) => taxApi.fileReturn(id).then(unwrap))
}

export function useSettleVatReturn() {
  return useFinanceMutation(({ id, treasuryId }: { id: string; treasuryId: string }) => taxApi.settleReturn(id, treasuryId).then(unwrap))
}

export function useIssueCertificates() {
  return useFinanceMutation((billIds: string[]) => taxApi.issueCertificates(billIds).then(unwrap))
}

export function useSubmitBatch() {
  return useFinanceMutation(() => taxApi.submitBatch().then(unwrap))
}

export function useResubmitGroup() {
  return useFinanceMutation((code: string) => taxApi.resubmitGroup(code).then(unwrap))
}

export function useRenewSeal() {
  return useFinanceMutation(() => taxApi.renewSeal().then(unwrap))
}

export function useMapItems() {
  return useFinanceMutation(() => taxApi.mapItems().then(unwrap))
}

export function useDocumentActions(id: string) {
  return {
    submit: useFinanceMutation(() => taxApi.submitDocument(id).then(unwrap)),
    fix: useFinanceMutation((code: string) => taxApi.fixDocument(id, code).then(unwrap)),
    cancel: useFinanceMutation((reason: string) => taxApi.cancelDocument(id, reason).then(unwrap)),
    refresh: useFinanceMutation(() => taxApi.refreshDocument(id).then(unwrap)),
  }
}

export function useFileDeclaration() {
  return useFinanceMutation((id: string) => taxApi.fileDeclaration(id).then(unwrap))
}

export function useCreateTaxCode() {
  return useFinanceMutation((payload: NewTaxCodePayload) => taxApi.createCode(payload).then(unwrap))
}

export function useGenerateAuditFile() {
  return useFinanceMutation(({ kind, period }: { kind: string; period: string }) => taxApi.generateAuditFile(kind, period).then(unwrap))
}
