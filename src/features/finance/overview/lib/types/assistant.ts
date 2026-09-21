export type AssistantTableColumn = { id: string; label: string; align?: "start" | "end" }

export type AssistantAnswer = {
  id: string
  topic: string
  question: string
  scope_label: string
  asked_at: string
  answered_at: string
  headline: string
  /** The screen the answer's figures match, e.g. "Tax & compliance / VAT return". */
  matches: string | null
  /** True when the assistant could not ground the answer (module off or missing). */
  limited?: boolean
  table: {
    columns: AssistantTableColumn[]
    rows: (Record<string, string | number> & { id: string })[]
    footnote: string
  } | null
  links: { label: string; href: string }[]
  proposal: {
    summary: string
    badge: string
    facts: { term: string; value: string }[]
    action: { label: string; href: string }
  } | null
  grounding: { label: string; detail: string }[]
  not_read: string[]
  sources: number
}

export type AssistantDataGroup = { id: string; label: string; available: boolean }

export type AssistantSettings = {
  id: string
  name: string
  model: string
  status: string
  data_groups: Record<string, boolean>
  bank_balances_admin_only: boolean
  retention_days: number
  groups: AssistantDataGroup[]
}

export type AssistantSettingsPayload = Partial<
  Pick<AssistantSettings, "name" | "data_groups" | "bank_balances_admin_only" | "retention_days">
>

export type AssistantDraftStatus = "opened_in_screen" | "actioned" | "dismissed" | "expired"

export type AssistantDraft = {
  id: string
  proposed_at: string
  type: string
  record: string
  conversation: string
  status: AssistantDraftStatus
  acted_by: string | null
  acted_at: string | null
  acted_note: string | null
  result: string
}

export type AssistantConversation = {
  id: string
  question: string
  scope_label: string
  asked_at: string
}

export type AssistantBriefing = {
  computed_at: string
  tiles: { id: string; label: string; value: number; caption: string }[]
  items: {
    id: string
    item: string
    count: number
    oldest: string
    owner: string
    destination: string
    href: string
  }[]
  follow_ups: string[]
}

export type AskPayload = { question: string; scope_label: string }
