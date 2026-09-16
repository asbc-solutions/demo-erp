/**
 * Wire-level shapes for GET/POST /integrations (see bruno/Integrations/Connections/*.bru):
 * - all fields are snake_case
 * - `status` is paired with `status_label` — always render the label, never
 *   derive display text from the raw enum client-side
 * - GET /integrations always returns every supported provider, connected or
 *   not, so every card always has data to render
 */

/** Supported providers per Connect Integration.bru docs. */
export type IntegrationProvider =
  | "stripe"
  | "quickbooks"
  | "gusto"
  | "github"
  | "notion"
  | "slack"
  | "google_workspace"
  | "zapier"

export type IntegrationStatus = "connected" | "disconnected" | "error"

export type IntegrationLastSync = {
  at: string | null
  status: "success" | "failed" | null
  message: string | null
}

/** Display-only settings echoed back by the API (never credentials/tokens). */
export type IntegrationSettings = Record<string, unknown>

/** Row shape from GET /integrations. */
export type Integration = {
  provider: IntegrationProvider
  label: string
  description: string
  category: string
  status: IntegrationStatus
  status_label: string
  is_connected: boolean
  connected_at: string | null
  disconnected_at: string | null
  last_sync: IntegrationLastSync
  external_account_ref: string | null
  settings: IntegrationSettings
}

export type IntegrationsSummary = {
  available: number
  connected: number
  errored: number
}

export type IntegrationsListMeta = {
  summary: IntegrationsSummary
}

export type ConnectIntegrationSettings = {
  workspace_name?: string
  environment?: "live" | "sandbox"
}

/** Never accepts access tokens / API keys — display data only, per docs. */
export type ConnectIntegrationPayload = {
  external_account_ref?: string
  settings?: ConnectIntegrationSettings
}

/** Response from POST /integrations/:provider/connect — a partial Integration. */
export type ConnectIntegrationResponse = Pick<
  Integration,
  | "provider"
  | "label"
  | "category"
  | "status"
  | "status_label"
  | "is_connected"
  | "connected_at"
  | "external_account_ref"
  | "settings"
>

/** Response from POST /integrations/:provider/disconnect — a partial Integration. */
export type DisconnectIntegrationResponse = Pick<
  Integration,
  | "provider"
  | "status"
  | "status_label"
  | "is_connected"
  | "disconnected_at"
  | "external_account_ref"
  | "settings"
>

export type RecordSyncPayload = {
  /** Defaults to `true` server-side when omitted. */
  succeeded?: boolean
  message?: string
}

/** Response from POST /integrations/:provider/sync — a partial Integration. */
export type RecordSyncResponse = Pick<
  Integration,
  "provider" | "label" | "status" | "status_label" | "is_connected" | "last_sync"
>
