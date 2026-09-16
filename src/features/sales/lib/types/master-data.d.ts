export type MasterDataReasonItem = {
  id: string
  code: string
  name_ar: string
  name_en: string
  requires_note: boolean
}

export type PaymentMethodItem = {
  id: string
  code: string
  name_ar: string
  name_en: string
  requires_reference: boolean
}

/** GET /sales/master-data — cached 1h server-side, invalidated on terms-template writes. */
export type SalesMasterData = {
  cancellation_reasons: MasterDataReasonItem[]
  rejection_reasons: MasterDataReasonItem[]
  edit_reasons: MasterDataReasonItem[]
  payment_methods: PaymentMethodItem[]
}

// No query params are documented for GET /sales/master-data.
export type MasterDataParams = Record<string, never>
