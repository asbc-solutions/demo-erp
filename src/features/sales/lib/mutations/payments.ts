"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { paymentsApi } from "../api/payments"
import { salesKeys } from "../constants/query-keys"
import type { RecordPaymentPayload, VoidPaymentPayload } from "../types"

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: RecordPaymentPayload }) =>
      paymentsApi.record(invoiceId, payload).then((r) => r.data.data),
    onSuccess: (_, { invoiceId }) => {
      qc.invalidateQueries({ queryKey: salesKeys.payments.byInvoice(invoiceId) })
      qc.invalidateQueries({ queryKey: salesKeys.invoices.detail(invoiceId) })
      qc.invalidateQueries({ queryKey: salesKeys.invoices.all })
    },
  })
}

export function useVoidPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { paymentId: string; invoiceId: string; payload: VoidPaymentPayload }) =>
      paymentsApi.void(vars.paymentId, vars.payload).then((r) => r.data.data),
    onSuccess: (_, { invoiceId }) => {
      qc.invalidateQueries({ queryKey: salesKeys.payments.byInvoice(invoiceId) })
      qc.invalidateQueries({ queryKey: salesKeys.invoices.detail(invoiceId) })
      qc.invalidateQueries({ queryKey: salesKeys.invoices.all })
    },
  })
}
