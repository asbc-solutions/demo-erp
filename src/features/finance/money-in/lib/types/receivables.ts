import type { SubledgerDocument, Voucher } from "../../../subledger/lib/types/subledger"

export type Collections = {
  overdue_base: number
  overdue_count: number
  over90_base: number
  over90_count: number
  items: SubledgerDocument[]
}

export type PostReceiptPayload = {
  contact_id: string
  treasury_id: string
  amount: number
  allocations: { invoice_id: string; amount: number }[]
}

export type PostedReceipt = Voucher & { unapplied: number }
