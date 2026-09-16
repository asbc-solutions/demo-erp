export type TermsTemplateAppliesTo = "quotation" | "order" | "invoice" | "all"

export type TermsTemplate = {
  id: string
  name: string
  body_ar: string | null
  body_en: string | null
  applies_to: TermsTemplateAppliesTo
  applies_to_label: string
  is_default: boolean
  is_active: boolean
}

// GET /sales/terms-templates has no documented query params — returns all templates.
export type TermsTemplateListParams = Record<string, never>

export type CreateTermsTemplatePayload = {
  name: string
  body_ar?: string
  body_en?: string
  applies_to: TermsTemplateAppliesTo
  is_default?: boolean
  is_active?: boolean
}

export type UpdateTermsTemplatePayload = Partial<CreateTermsTemplatePayload>
