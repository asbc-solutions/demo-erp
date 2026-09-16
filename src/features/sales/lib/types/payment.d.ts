/**
 * List/Record response shapes aren't given as example JSON in the Bruno
 * docs (only field-level assertions) — modeled from the documented request
 * fields plus the fields Void Payment asserts on (`is_voided`). Confirm
 * against a live call before relying on `payment_method_name`.
 */
export type Payment = {
  id: string
  invoice_id: string
  amount: number
  payment_method_id: string
  payment_method_name: string | null
  reference: string | null
  paid_at: string
  note: string | null
  is_voided: boolean
  voided_at: string | null
  void_reason: string | null
  created_at: string
}

export type RecordPaymentPayload = {
  /** Must be > 0 and <= the invoice's remaining_due. */
  amount: number
  payment_method_id: string
  reference?: string
  paid_at: string
  note?: string
}

export type VoidPaymentPayload = {
  void_reason: string
}
