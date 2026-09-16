export type CompanyProfileOptions = {
  industries: string[]
  stages: string[]
}

export type CompanyProfile = {
  name: string | null
  website: string | null
  industry: string | null
  stage: string | null
  team_size: string | null
  onboarding_completed: boolean
  options: CompanyProfileOptions
}

/** `PUT /settings/company-profile` response — same fields, no `options`. */
export type UpdateCompanyProfileResult = {
  name: string
  website: string | null
  industry: string | null
  stage: string | null
  team_size: string | null
  onboarding_completed: boolean
}

export type UpdateCompanyProfilePayload = {
  name: string
  website?: string
  industry?: string
  stage?: string
}

export type ResetDemoDataPayload = {
  confirm: true
}

export type ResetDemoDataResult = {
  reset_at: string
  sessions_invalidated: boolean
}
