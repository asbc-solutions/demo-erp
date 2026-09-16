"use client"

import { useQuery } from "@tanstack/react-query"
import { paymentsApi } from "../api/payments"
import { salesKeys } from "../constants/query-keys"

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: salesKeys.payments.byInvoice(invoiceId),
    queryFn: () => paymentsApi.list(invoiceId).then((r) => r.data.data),
    enabled: !!invoiceId,
  })
}
