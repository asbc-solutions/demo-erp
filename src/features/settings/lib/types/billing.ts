export type BillingPlan = {
  id: string
  code: string
  name: string
  price_amount: number
  currency_code: string
  billing_interval: string
  seat_limit?: number
  storage_limit_gb?: number
}

export type BillingUsage = {
  seats_used: number
  seat_limit: number
  storage_used_gb: number
  storage_limit_gb: number
}

export type BillingSubscription = {
  id: string
  status: string
  next_billing_date: string
  plan: BillingPlan
  usage: BillingUsage
}

/** Display-only — never contains `provider_token`, which is a payment-provider credential and is never returned by the API. */
export type PaymentMethod = {
  id: string
  provider: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
}

export type BillingOverview = {
  subscription: BillingSubscription | null
  payment_method: PaymentMethod | null
  available_plans: BillingPlan[]
}

export type ChangePlanPayload = {
  plan_id: string
}

export type BillingInvoiceStatus = "paid" | "open" | "void"

export type BillingInvoice = {
  id: string
  invoice_number: string
  amount: number
  currency_code: string
  status: BillingInvoiceStatus
  issued_on: string
  period_start: string
  period_end: string
  /** When false, the download endpoint 404s — there is no file to stream. */
  has_document: boolean
}

export type DownloadInvoiceResult = {
  /** Signed URL valid for 15 minutes — open directly, don't cache it. */
  download_url: string
}

/**
 * `PUT /settings/billing/payment-method` request body. The backend REJECTS raw
 * card numbers/CVC outright (no such fields exist in validation) — `provider_token`
 * must come from client-side tokenization with the payment provider's SDK
 * (Stripe/Paymob/Fawry), which is out of scope here. This type only accepts the
 * token + display metadata the provider returns.
 */
export type SavePaymentMethodPayload = {
  provider?: "stripe" | "paymob" | "fawry"
  provider_token: string
  brand?: string
  last4?: string
  exp_month?: number
  exp_year?: number
}

export type SavePaymentMethodResult = PaymentMethod
